//! ONI escrow, PREVIEW (not audited, not built, not deployed, not called by the game yet).
//!
//! Holds the SOL stakes of a 1v1 match in a vault that nobody can touch,
//! then pays the winner and splits the fee automatically.
//!
//! Flow:
//!   1. create_match   -> player A sends the stake (SOL) to the match vault
//!   2. join_match     -> player B sends the same amount; the match is Ready
//!   3. settle_match   -> the ONI game server (the "referee") reports the winner
//!                        after replaying the match from its key log:
//!                        winner gets the pot minus the fee,
//!                        fee goes 3.5% ONI / 1% season pot / 0.5% curse pot
//!   4. cancel_match   -> A gets the stake back if nobody joined
//!   5. refund_expired -> if a Ready match is never settled (server down),
//!                        ANYONE can refund both players after the timeout.
//!
//! Amounts are in lamports (1 SOL = 1,000,000,000 lamports). The game shows
//! prices in USD and converts to SOL when the player pays; both players always
//! lock exactly the same number of lamports.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("2amYWqLWcnrz1wFUnEEDrrvS6Tqew6XPhJzeDck3JFqR"); // placeholder: run `anchor keys sync` before the first deploy

pub const FEE_BPS_MAX: u16 = 500;        // 5% for normal players
pub const FEE_BPS_MIN: u16 = 300;        // 3% for Gold holders
pub const SEASON_BPS: u16 = 100;         // 1% of the pot to rank rewards
pub const CURSE_BPS: u16 = 50;           // 0.5% of the pot to the Curse Cauldron
pub const MIN_STAKE: u64 = 1_000_000;    // 0.001 SOL, keeps the vault above rent minimums
pub const SETTLE_TIMEOUT_SECS: i64 = 60 * 60;

#[program]
pub mod oni_escrow {
    use super::*;

    /// One-time setup by the ONI admin: who the referee is and where fees go.
    pub fn initialize_config(ctx: Context<InitializeConfig>, referee: Pubkey) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.referee = referee;
        cfg.treasury = ctx.accounts.treasury.key();
        cfg.season_pot = ctx.accounts.season_pot.key();
        cfg.curse_pot = ctx.accounts.curse_pot.key();
        cfg.paused = false;
        Ok(())
    }

    /// Player A opens a match and sends the stake to the vault.
    pub fn create_match(ctx: Context<CreateMatch>, match_id: u64, stake: u64) -> Result<()> {
        require!(!ctx.accounts.config.paused, OniError::Paused);
        require!(stake >= MIN_STAKE, OniError::BadStake);
        let m = &mut ctx.accounts.match_acc;
        m.match_id = match_id;
        m.player_a = ctx.accounts.player.key();
        m.player_b = Pubkey::default();
        m.stake = stake;
        m.state = MatchState::Open;
        m.created_at = Clock::get()?.unix_timestamp;
        m.ready_at = 0;
        m.vault_bump = ctx.bumps.vault;
        m.bump = ctx.bumps.match_acc;
        system_program::transfer(CpiContext::new(ctx.accounts.system_program.to_account_info(),
            Transfer { from: ctx.accounts.player.to_account_info(), to: ctx.accounts.vault.to_account_info() }), stake)?;
        emit!(MatchCreated { match_id, player: m.player_a, stake });
        Ok(())
    }

    /// Player B joins with exactly the same stake. The match becomes Ready.
    pub fn join_match(ctx: Context<JoinMatch>) -> Result<()> {
        let m = &mut ctx.accounts.match_acc;
        require!(m.state == MatchState::Open, OniError::WrongState);
        require!(ctx.accounts.player.key() != m.player_a, OniError::SamePlayer);
        m.player_b = ctx.accounts.player.key();
        m.state = MatchState::Ready;
        m.ready_at = Clock::get()?.unix_timestamp;
        let stake = m.stake;
        system_program::transfer(CpiContext::new(ctx.accounts.system_program.to_account_info(),
            Transfer { from: ctx.accounts.player.to_account_info(), to: ctx.accounts.vault.to_account_info() }), stake)?;
        emit!(MatchJoined { match_id: m.match_id, player: m.player_b });
        Ok(())
    }

    /// The referee (the ONI game server) reports the winner after verifying the replay.
    /// fee_bps depends on the winner's $ONI tier and must stay between 3% and 5%.
    pub fn settle_match(ctx: Context<SettleMatch>, winner: Pubkey, fee_bps: u16) -> Result<()> {
        let m = &ctx.accounts.match_acc;
        let match_id = m.match_id;
        require!(m.state == MatchState::Ready, OniError::WrongState);
        require!(winner == m.player_a || winner == m.player_b, OniError::NotAPlayer);
        require!(ctx.accounts.winner.key() == winner, OniError::NotAPlayer);
        require!((FEE_BPS_MIN..=FEE_BPS_MAX).contains(&fee_bps), OniError::BadFee);

        let Split { prize, house, season, curse, fee } = split(m.stake, fee_bps).ok_or(OniError::Overflow)?;

        let id = match_id.to_le_bytes();
        let seeds: &[&[u8]] = &[b"vault", &id, &[m.vault_bump]];
        let sys = ctx.accounts.system_program.to_account_info();
        let vault = ctx.accounts.vault.to_account_info();
        for (to, amount) in [
            (ctx.accounts.winner.to_account_info(), prize),
            (ctx.accounts.treasury.to_account_info(), house),
            (ctx.accounts.season_pot.to_account_info(), season),
            (ctx.accounts.curse_pot.to_account_info(), curse),
        ] {
            if amount == 0 { continue; }
            system_program::transfer(CpiContext::new_with_signer(sys.clone(),
                Transfer { from: vault.clone(), to }, &[seeds]), amount)?;
        }
        ctx.accounts.match_acc.state = MatchState::Settled;
        emit!(MatchSettled { match_id, winner, prize, fee });
        Ok(())
    }

    /// Player A takes the stake back if nobody joined yet.
    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        let m = &ctx.accounts.match_acc;
        require!(m.state == MatchState::Open, OniError::WrongState);
        let id = m.match_id.to_le_bytes();
        let seeds: &[&[u8]] = &[b"vault", &id, &[m.vault_bump]];
        let stake = m.stake;
        system_program::transfer(CpiContext::new_with_signer(ctx.accounts.system_program.to_account_info(),
            Transfer { from: ctx.accounts.vault.to_account_info(), to: ctx.accounts.player_a.to_account_info() }, &[seeds]), stake)?;
        ctx.accounts.match_acc.state = MatchState::Cancelled;
        Ok(())
    }

    /// Safety net: if a Ready match was not settled within the timeout,
    /// anyone can give both players their stakes back. No fee is taken.
    pub fn refund_expired(ctx: Context<RefundExpired>) -> Result<()> {
        let m = &ctx.accounts.match_acc;
        require!(m.state == MatchState::Ready, OniError::WrongState);
        let now = Clock::get()?.unix_timestamp;
        require!(now > m.ready_at + SETTLE_TIMEOUT_SECS, OniError::TooEarly);
        let id = m.match_id.to_le_bytes();
        let seeds: &[&[u8]] = &[b"vault", &id, &[m.vault_bump]];
        let stake = m.stake;
        let sys = ctx.accounts.system_program.to_account_info();
        for to in [ctx.accounts.player_a.to_account_info(), ctx.accounts.player_b.to_account_info()] {
            system_program::transfer(CpiContext::new_with_signer(sys.clone(),
                Transfer { from: ctx.accounts.vault.to_account_info(), to }, &[seeds]), stake)?;
        }
        ctx.accounts.match_acc.state = MatchState::Refunded;
        Ok(())
    }

    /// Emergency switch for the admin: stops NEW matches only. Existing stakes can
    /// still be settled or refunded, so the admin can never freeze player money.
    pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
        ctx.accounts.config.paused = paused;
        Ok(())
    }
}

// ---------------------------------------------------------------- payout math (pure, unit-tested)

/// How a settled pot is paid out. Always sums back to exactly 2 x stake.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Split { pub prize: u64, pub house: u64, pub season: u64, pub curse: u64, pub fee: u64 }

/// Splits the pot of a match (both stakes) for a fee between 3% and 5%.
/// Season (1%) and Curse (0.5%) are fixed; ONI keeps the rest of the fee.
/// Rounding dust goes to the winner, never to ONI. Returns None on overflow or a bad fee.
pub fn split(stake: u64, fee_bps: u16) -> Option<Split> {
    if !(FEE_BPS_MIN..=FEE_BPS_MAX).contains(&fee_bps) { return None; }
    let pot = (stake as u128).checked_mul(2)?;
    let bps = |b: u16| pot * b as u128 / 10_000;
    let season = bps(SEASON_BPS);
    let curse = bps(CURSE_BPS);
    let fee = bps(fee_bps).max(season + curse);
    let house = fee - season - curse;
    let prize = pot - fee;
    Some(Split {
        prize: u64::try_from(prize).ok()?, house: u64::try_from(house).ok()?,
        season: u64::try_from(season).ok()?, curse: u64::try_from(curse).ok()?, fee: u64::try_from(fee).ok()?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    const SOL: u64 = 1_000_000_000;

    #[test]
    fn ten_dollar_match_at_5_percent() {
        // 0.1 SOL each, pot 0.2 SOL: winner 0.19, ONI 0.007, season 0.002, curse 0.001
        let s = split(SOL / 10, 500).unwrap();
        assert_eq!(s.prize, 190_000_000);
        assert_eq!(s.house, 7_000_000);
        assert_eq!(s.season, 2_000_000);
        assert_eq!(s.curse, 1_000_000);
        assert_eq!(s.fee, 10_000_000);
    }

    #[test]
    fn gold_holder_pays_3_percent() {
        let s = split(SOL, 300).unwrap();
        assert_eq!(s.fee, 60_000_000);
        assert_eq!(s.prize, 2 * SOL - 60_000_000);
        assert_eq!(s.season + s.curse, 30_000_000);
    }

    #[test]
    fn nothing_is_lost_for_any_stake_or_tier() {
        for stake in [MIN_STAKE, MIN_STAKE + 7, 123_456_789, SOL, 1_000 * SOL, u64::MAX / 2] {
            for fee in [300u16, 350, 400, 500] {
                let s = split(stake, fee).unwrap();
                assert_eq!(s.prize as u128 + s.house as u128 + s.season as u128 + s.curse as u128, stake as u128 * 2,
                    "stake {stake} fee {fee}");
                assert_eq!(s.fee, s.house + s.season + s.curse);
                assert!(s.prize > s.fee, "winner always gets most of the pot");
            }
        }
    }

    #[test]
    fn fee_outside_3_to_5_percent_is_refused() {
        for bad in [0u16, 299, 501, 1_000, 10_000] { assert!(split(SOL, bad).is_none(), "fee {bad}"); }
    }

    #[test]
    fn huge_stake_does_not_overflow() {
        assert!(split(u64::MAX / 2, 500).is_some());
        assert!(split(u64::MAX, 500).is_none());
    }

    #[test]
    fn print_discriminators() {
        use anchor_lang::Discriminator;
        println!("DISC initialize_config {:?}", crate::instruction::InitializeConfig::DISCRIMINATOR);
        println!("DISC create_match {:?}", crate::instruction::CreateMatch::DISCRIMINATOR);
        println!("DISC join_match {:?}", crate::instruction::JoinMatch::DISCRIMINATOR);
        println!("DISC settle_match {:?}", crate::instruction::SettleMatch::DISCRIMINATOR);
        println!("DISC cancel_match {:?}", crate::instruction::CancelMatch::DISCRIMINATOR);
        println!("DISC refund_expired {:?}", crate::instruction::RefundExpired::DISCRIMINATOR);
        println!("DISC set_paused {:?}", crate::instruction::SetPaused::DISCRIMINATOR);
    }
}

// ---------------------------------------------------------------- accounts

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub referee: Pubkey,      // the ONI game server key that reports verified results
    pub treasury: Pubkey,     // 3.5%
    pub season_pot: Pubkey,   // 1%
    pub curse_pot: Pubkey,    // 0.5%
    pub paused: bool,
}

#[account]
pub struct Match {
    pub match_id: u64,
    pub player_a: Pubkey,
    pub player_b: Pubkey,
    pub stake: u64,           // lamports per player
    pub state: MatchState,
    pub created_at: i64,
    pub ready_at: i64,
    pub vault_bump: u8,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MatchState { Open, Ready, Settled, Cancelled, Refunded }

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(init, payer = admin, space = 8 + 32 * 5 + 1, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: any wallet that receives ONI's share
    pub treasury: UncheckedAccount<'info>,
    /// CHECK: wallet of the season rewards pot
    pub season_pot: UncheckedAccount<'info>,
    /// CHECK: wallet of the Curse Cauldron
    pub curse_pot: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct CreateMatch<'info> {
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(init, payer = player, space = 8 + 8 + 32 * 2 + 8 + 1 + 8 + 8 + 1 + 1,
              seeds = [b"match".as_ref(), match_id.to_le_bytes().as_ref()], bump)]
    pub match_acc: Account<'info, Match>,
    /// The vault is a program address with no data: only this program can move its SOL.
    #[account(mut, seeds = [b"vault".as_ref(), match_id.to_le_bytes().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut, seeds = [b"match".as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump)]
    pub match_acc: Account<'info, Match>,
    #[account(mut, seeds = [b"vault".as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.vault_bump)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleMatch<'info> {
    #[account(seeds = [b"config"], bump, has_one = referee, has_one = treasury, has_one = season_pot, has_one = curse_pot)]
    pub config: Account<'info, Config>,
    pub referee: Signer<'info>,   // only the ONI server can report a result
    #[account(mut, seeds = [b"match".as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump)]
    pub match_acc: Account<'info, Match>,
    #[account(mut, seeds = [b"vault".as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.vault_bump)]
    pub vault: SystemAccount<'info>,
    /// CHECK: must equal the reported winner (checked in the instruction)
    #[account(mut)] pub winner: UncheckedAccount<'info>,
    /// CHECK: fixed by config
    #[account(mut)] pub treasury: UncheckedAccount<'info>,
    /// CHECK: fixed by config
    #[account(mut)] pub season_pot: UncheckedAccount<'info>,
    /// CHECK: fixed by config
    #[account(mut)] pub curse_pot: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(mut, seeds = [b"match".as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump, has_one = player_a)]
    pub match_acc: Account<'info, Match>,
    #[account(mut)]
    pub player_a: Signer<'info>,
    #[account(mut, seeds = [b"vault".as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.vault_bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundExpired<'info> {
    #[account(mut, seeds = [b"match".as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump,
              has_one = player_a, has_one = player_b)]
    pub match_acc: Account<'info, Match>,
    #[account(mut, seeds = [b"vault".as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.vault_bump)]
    pub vault: SystemAccount<'info>,
    /// CHECK: checked against the match by has_one
    #[account(mut)] pub player_a: UncheckedAccount<'info>,
    /// CHECK: checked against the match by has_one
    #[account(mut)] pub player_b: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(mut, seeds = [b"config"], bump, has_one = admin)]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
}

// ---------------------------------------------------------------- events and errors

#[event] pub struct MatchCreated { pub match_id: u64, pub player: Pubkey, pub stake: u64 }
#[event] pub struct MatchJoined { pub match_id: u64, pub player: Pubkey }
#[event] pub struct MatchSettled { pub match_id: u64, pub winner: Pubkey, pub prize: u64, pub fee: u64 }

#[error_code]
pub enum OniError {
    #[msg("New matches are paused")] Paused,
    #[msg("Stake is below the minimum (0.001 SOL)")] BadStake,
    #[msg("The match is not in the right state for this")] WrongState,
    #[msg("You cannot play against yourself")] SamePlayer,
    #[msg("That wallet is not a player of this match")] NotAPlayer,
    #[msg("Fee must be between 3% and 5%")] BadFee,
    #[msg("Math overflow")] Overflow,
    #[msg("The settle window is still open")] TooEarly,
}
