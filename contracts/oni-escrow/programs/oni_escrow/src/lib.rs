//! ONI escrow, PREVIEW: UNAUDITED, NOT DEPLOYED, not called by the game yet.
//!
//! Holds the SOL stakes of a 1v1 match inside the match account itself (a PDA owned
//! by this program), then pays the winner and accrues the fee by fixed rules.
//!
//! Flow:
//!   1. create_match(id, stake, opponent) -> player A locks the stake. `opponent` is the
//!                        only wallet that may join; `Pubkey::default()` means "open",
//!                        and then a join must be co-signed by the referee (matchmaker).
//!   2. join_match     -> player B locks the same stake; the match is Ready and the
//!                        settle window (SETTLE_TIMEOUT_SECS) starts.
//!   3. settle_match   -> the referee (ONI game server) reports the winner. Winner gets
//!                        the pot minus a 3-5% fee; the fee accrues in the config PDA.
//!      void_match     -> the referee refunds both in full (draw / no contest), no fee.
//!   4. cancel_match   -> A takes the stake back at any time while nobody has joined.
//!   5. refund_expired -> once the settle window is over, ANYONE refunds both players.
//!                        Needs no config account, so neither pause nor admin can block it.
//!   6. withdraw_fees  -> anyone moves accrued fees to the treasury / season / curse
//!                        wallets fixed in config. Player payouts never depend on them.
//!
//! Every terminal instruction closes the match account to player A (who paid its rent).
//! Amounts are lamports. All arithmetic is checked.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("2amYWqLWcnrz1wFUnEEDrrvS6Tqew6XPhJzeDck3JFqR"); // placeholder: run `anchor keys sync` before the first deploy

pub const FEE_BPS_MAX: u16 = 500; // 5% for normal players
pub const FEE_BPS_MIN: u16 = 300; // 3% for Gold holders
pub const SEASON_BPS: u16 = 100; // 1% of the pot to rank rewards
pub const CURSE_BPS: u16 = 50; // 0.5% of the pot to the Curse Cauldron
pub const MIN_STAKE: u64 = 1_000_000; // 0.001 SOL
pub const SETTLE_TIMEOUT_SECS: i64 = 60 * 60;

#[program]
pub mod oni_escrow {
    use super::*;

    /// One-time setup. Only the program's upgrade authority can call it, so nobody can
    /// front-run the deploy and install their own admin/referee.
    pub fn initialize_config(ctx: Context<InitializeConfig>, referee: Pubkey) -> Result<()> {
        require!(referee != Pubkey::default(), OniError::BadKey);
        let cfg = &mut ctx.accounts.config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.pending_admin = Pubkey::default();
        cfg.referee = referee;
        cfg.treasury = ctx.accounts.treasury.key();
        cfg.season_pot = ctx.accounts.season_pot.key();
        cfg.curse_pot = ctx.accounts.curse_pot.key();
        cfg.paused = false;
        cfg.fees_house = 0;
        cfg.fees_season = 0;
        cfg.fees_curse = 0;
        cfg.bump = ctx.bumps.config;
        Ok(())
    }

    /// Player A opens a match and locks the stake in the match account.
    pub fn create_match(ctx: Context<CreateMatch>, match_id: u64, stake: u64, opponent: Pubkey) -> Result<()> {
        let player = ctx.accounts.player.key();
        guard_create(ctx.accounts.config.paused, stake, player, opponent)?;
        let m = &mut ctx.accounts.match_acc;
        m.match_id = match_id;
        m.player_a = player;
        m.player_b = opponent; // default() = open, filled in on join
        m.stake = stake;
        m.state = MatchState::Open;
        m.created_at = Clock::get()?.unix_timestamp;
        m.ready_at = 0;
        m.bump = ctx.bumps.match_acc;
        system_program::transfer(
            CpiContext::new(ctx.accounts.system_program.to_account_info(),
                Transfer { from: ctx.accounts.player.to_account_info(), to: ctx.accounts.match_acc.to_account_info() }),
            stake,
        )?;
        emit!(MatchCreated { match_id, player_a: player, opponent, stake });
        Ok(())
    }

    /// Player B joins with exactly the same stake. Only the named opponent may join;
    /// an open match additionally needs the referee's co-signature.
    pub fn join_match(ctx: Context<JoinMatch>) -> Result<()> {
        let joiner = ctx.accounts.player.key();
        let cosigned = ctx.accounts.referee.as_ref().map(|r| r.key() == ctx.accounts.config.referee).unwrap_or(false);
        let m = &ctx.accounts.match_acc;
        guard_join(ctx.accounts.config.paused, m.state, m.player_a, m.player_b, joiner, cosigned)?;
        let stake = m.stake;
        system_program::transfer(
            CpiContext::new(ctx.accounts.system_program.to_account_info(),
                Transfer { from: ctx.accounts.player.to_account_info(), to: ctx.accounts.match_acc.to_account_info() }),
            stake,
        )?;
        let m = &mut ctx.accounts.match_acc;
        m.player_b = joiner;
        m.state = MatchState::Ready;
        m.ready_at = Clock::get()?.unix_timestamp;
        emit!(MatchJoined { match_id: m.match_id, player_a: m.player_a, player_b: joiner });
        Ok(())
    }

    /// The referee reports the winner inside the settle window. fee_bps depends on the
    /// winner's $ONI tier and must stay between 3% and 5%. Closes the match to player A.
    pub fn settle_match(ctx: Context<SettleMatch>, winner: Pubkey, fee_bps: u16) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let m = &ctx.accounts.match_acc;
        guard_settle(m.state, m.ready_at, now)?;
        require!(winner == m.player_a || winner == m.player_b, OniError::NotAPlayer);
        let s = split(m.stake, fee_bps).ok_or(OniError::BadFee)?;
        let match_id = m.match_id;
        let to = if winner == m.player_a { ctx.accounts.player_a.to_account_info() } else { ctx.accounts.player_b.to_account_info() };
        let from = ctx.accounts.match_acc.to_account_info();
        move_lamports(&from, &to, s.prize)?;
        move_lamports(&from, &ctx.accounts.config.to_account_info(), s.fee)?;
        let cfg = &mut ctx.accounts.config;
        cfg.fees_house = cfg.fees_house.checked_add(s.house).ok_or(OniError::Overflow)?;
        cfg.fees_season = cfg.fees_season.checked_add(s.season).ok_or(OniError::Overflow)?;
        cfg.fees_curse = cfg.fees_curse.checked_add(s.curse).ok_or(OniError::Overflow)?;
        ctx.accounts.match_acc.state = MatchState::Settled;
        emit!(MatchSettled { match_id, winner, prize: s.prize, fee: s.fee });
        Ok(()) // `close = player_a` returns the rent (and any dust) to A
    }

    /// The referee refunds both stakes in full (draw, no-show seen by the server, bug).
    /// Gives the referee no power it does not already have through settle_match.
    pub fn void_match(ctx: Context<VoidMatch>) -> Result<()> {
        let m = &ctx.accounts.match_acc;
        require!(m.state == MatchState::Ready, OniError::WrongState);
        let (match_id, stake) = (m.match_id, m.stake);
        move_lamports(&ctx.accounts.match_acc.to_account_info(), &ctx.accounts.player_b.to_account_info(), stake)?;
        ctx.accounts.match_acc.state = MatchState::Refunded;
        emit!(MatchRefunded { match_id, by_referee: true });
        Ok(()) // close = player_a: A gets stake + rent back
    }

    /// Player A takes the stake back at any time while the match is unjoined.
    /// Works while paused and needs no config, so it cannot be blocked.
    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        let m = &mut ctx.accounts.match_acc;
        require!(m.state == MatchState::Open, OniError::WrongState);
        m.state = MatchState::Cancelled;
        emit!(MatchCancelled { match_id: m.match_id });
        Ok(()) // close = player_a: stake + rent go back to A
    }

    /// Safety net: once the settle window is over, ANYONE can refund both players.
    /// Needs no config and no signer, so pause, admin or referee cannot block it.
    pub fn refund_expired(ctx: Context<RefundExpired>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let m = &ctx.accounts.match_acc;
        guard_refund(m.state, m.ready_at, now)?;
        let (match_id, stake) = (m.match_id, m.stake);
        move_lamports(&ctx.accounts.match_acc.to_account_info(), &ctx.accounts.player_b.to_account_info(), stake)?;
        ctx.accounts.match_acc.state = MatchState::Refunded;
        emit!(MatchRefunded { match_id, by_referee: false });
        Ok(()) // close = player_a: A gets stake + rent back
    }

    /// Moves accrued fees to the wallets fixed in config. Permissionless: the
    /// destinations cannot be chosen by the caller. Player payouts never wait on this.
    pub fn withdraw_fees(ctx: Context<WithdrawFees>) -> Result<()> {
        let cfg_info = ctx.accounts.config.to_account_info();
        let (h, s, c) = (ctx.accounts.config.fees_house, ctx.accounts.config.fees_season, ctx.accounts.config.fees_curse);
        move_lamports(&cfg_info, &ctx.accounts.treasury.to_account_info(), h)?;
        move_lamports(&cfg_info, &ctx.accounts.season_pot.to_account_info(), s)?;
        move_lamports(&cfg_info, &ctx.accounts.curse_pot.to_account_info(), c)?;
        let cfg = &mut ctx.accounts.config;
        cfg.fees_house = 0;
        cfg.fees_season = 0;
        cfg.fees_curse = 0;
        Ok(())
    }

    /// Admin: stop NEW matches and joins. Settle, void, cancel and refund keep working,
    /// so the admin can never freeze player money.
    pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
        ctx.accounts.config.paused = paused;
        emit!(ConfigChanged { what: if paused { 1 } else { 2 } });
        Ok(())
    }

    /// Admin: rotate the referee key (e.g. after a server key compromise). Takes effect
    /// for every Ready match, so a compromised ADMIN key is as bad as a compromised referee:
    /// keep the admin in a multisig.
    pub fn set_referee(ctx: Context<AdminOnly>, referee: Pubkey) -> Result<()> {
        require!(referee != Pubkey::default(), OniError::BadKey);
        ctx.accounts.config.referee = referee;
        emit!(ConfigChanged { what: 3 });
        Ok(())
    }

    /// Admin: change where withdrawn fees go. Does not touch player stakes.
    pub fn set_fee_accounts(ctx: Context<SetFeeAccounts>) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.treasury = ctx.accounts.treasury.key();
        cfg.season_pot = ctx.accounts.season_pot.key();
        cfg.curse_pot = ctx.accounts.curse_pot.key();
        emit!(ConfigChanged { what: 4 });
        Ok(())
    }

    /// Admin hand-over, step 1: name the next admin (default() cancels a pending hand-over).
    pub fn propose_admin(ctx: Context<AdminOnly>, new_admin: Pubkey) -> Result<()> {
        ctx.accounts.config.pending_admin = new_admin;
        emit!(ConfigChanged { what: 5 });
        Ok(())
    }

    /// Admin hand-over, step 2: the proposed admin signs to accept, so a typo cannot
    /// hand the program to a key nobody holds.
    pub fn accept_admin(ctx: Context<AcceptAdmin>) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        require!(cfg.pending_admin != Pubkey::default() && cfg.pending_admin == ctx.accounts.new_admin.key(), OniError::Unauthorized);
        cfg.admin = cfg.pending_admin;
        cfg.pending_admin = Pubkey::default();
        emit!(ConfigChanged { what: 6 });
        Ok(())
    }
}

// ---------------------------------------------------------------- pure rules (unit-tested with plain `cargo test`)

/// Debits a program-owned account and credits any account, with checked math.
fn move_lamports<'a>(from: &AccountInfo<'a>, to: &AccountInfo<'a>, amount: u64) -> Result<()> {
    if amount == 0 { return Ok(()); }
    let new_from = from.lamports().checked_sub(amount).ok_or(OniError::Overflow)?;
    let new_to = to.lamports().checked_add(amount).ok_or(OniError::Overflow)?;
    **from.try_borrow_mut_lamports()? = new_from;
    **to.try_borrow_mut_lamports()? = new_to;
    Ok(())
}

/// First second at which the settle window is closed. settle: now < deadline; refund: now >= deadline.
pub fn settle_deadline(ready_at: i64) -> Option<i64> { ready_at.checked_add(SETTLE_TIMEOUT_SECS) }

pub fn guard_create(paused: bool, stake: u64, player: Pubkey, opponent: Pubkey) -> std::result::Result<(), OniError> {
    if paused { return Err(OniError::Paused); }
    if stake < MIN_STAKE { return Err(OniError::BadStake); }
    // the pot (2 x stake) must fit in u64, so payouts can never overflow
    if stake.checked_mul(2).is_none() { return Err(OniError::BadStake); }
    if opponent == player { return Err(OniError::SamePlayer); }
    Ok(())
}

/// `named` is the match's player_b at create time (default() = open match).
pub fn guard_join(paused: bool, state: MatchState, player_a: Pubkey, named: Pubkey, joiner: Pubkey, referee_cosigned: bool)
    -> std::result::Result<(), OniError> {
    if paused { return Err(OniError::Paused); }
    if state != MatchState::Open { return Err(OniError::WrongState); }
    if joiner == player_a { return Err(OniError::SamePlayer); }
    if named == Pubkey::default() {
        if !referee_cosigned { return Err(OniError::NeedsReferee); }
    } else if joiner != named {
        return Err(OniError::NotInvited);
    }
    Ok(())
}

pub fn guard_settle(state: MatchState, ready_at: i64, now: i64) -> std::result::Result<(), OniError> {
    if state != MatchState::Ready { return Err(OniError::WrongState); }
    let deadline = settle_deadline(ready_at).ok_or(OniError::Overflow)?;
    if now >= deadline { return Err(OniError::TooLate); }
    Ok(())
}

pub fn guard_refund(state: MatchState, ready_at: i64, now: i64) -> std::result::Result<(), OniError> {
    if state != MatchState::Ready { return Err(OniError::WrongState); }
    let deadline = settle_deadline(ready_at).ok_or(OniError::Overflow)?;
    if now < deadline { return Err(OniError::TooEarly); }
    Ok(())
}

/// How a settled pot is paid out. prize + fee == 2 x stake, fee == house + season + curse.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Split { pub prize: u64, pub house: u64, pub season: u64, pub curse: u64, pub fee: u64 }

/// Splits the pot (both stakes) for a fee between 3% and 5%. Season (1%) and Curse (0.5%)
/// are fixed; ONI keeps the rest of the fee. Rounding dust goes to the winner, never to ONI.
/// Returns None on a fee outside 3-5% or a pot that does not fit in u64.
pub fn split(stake: u64, fee_bps: u16) -> Option<Split> {
    if !(FEE_BPS_MIN..=FEE_BPS_MAX).contains(&fee_bps) { return None; }
    let pot = (stake as u128).checked_mul(2)?;
    if pot > u64::MAX as u128 { return None; }
    let bps = |b: u16| pot.checked_mul(b as u128).map(|x| x / 10_000);
    let season = bps(SEASON_BPS)?;
    let curse = bps(CURSE_BPS)?;
    let fee = bps(fee_bps)?.max(season.checked_add(curse)?);
    let house = fee.checked_sub(season)?.checked_sub(curse)?;
    let prize = pot.checked_sub(fee)?;
    Some(Split {
        prize: u64::try_from(prize).ok()?, house: u64::try_from(house).ok()?,
        season: u64::try_from(season).ok()?, curse: u64::try_from(curse).ok()?, fee: u64::try_from(fee).ok()?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    const SOL: u64 = 1_000_000_000;
    fn k(n: u8) -> Pubkey { Pubkey::new_from_array([n; 32]) }
    const NONE: Pubkey = Pubkey::new_from_array([0; 32]);

    #[test]
    fn ten_dollar_match_at_5_percent() {
        // 0.1 SOL each, pot 0.2 SOL: winner 0.19, ONI 0.007, season 0.002, curse 0.001
        let s = split(SOL / 10, 500).unwrap();
        assert_eq!((s.prize, s.house, s.season, s.curse, s.fee), (190_000_000, 7_000_000, 2_000_000, 1_000_000, 10_000_000));
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
            for fee in FEE_BPS_MIN..=FEE_BPS_MAX {
                let s = split(stake, fee).unwrap();
                assert_eq!(s.prize as u128 + s.fee as u128, stake as u128 * 2, "stake {stake} fee {fee}");
                assert_eq!(s.fee, s.house + s.season + s.curse);
                assert!(s.prize > s.fee, "winner always gets most of the pot");
                // fee never exceeds the cap (dust rounds toward the winner)
                assert!(s.fee as u128 * 10_000 <= stake as u128 * 2 * fee as u128);
            }
        }
    }

    #[test]
    fn fee_outside_3_to_5_percent_is_refused() {
        for bad in [0u16, 1, 299, 501, 1_000, 10_000, u16::MAX] { assert!(split(SOL, bad).is_none(), "fee {bad}"); }
    }

    #[test]
    fn pot_must_fit_in_u64() {
        assert!(split(u64::MAX / 2, 500).is_some());
        assert!(split(u64::MAX / 2 + 1, 500).is_none());
        assert!(split(u64::MAX, 500).is_none());
        assert!(matches!(guard_create(false, u64::MAX / 2 + 1, k(1), NONE), Err(OniError::BadStake)));
    }

    #[test]
    fn create_rules() {
        assert!(guard_create(false, MIN_STAKE, k(1), NONE).is_ok());
        assert!(guard_create(false, MIN_STAKE, k(1), k(2)).is_ok());
        assert!(matches!(guard_create(true, MIN_STAKE, k(1), k(2)), Err(OniError::Paused)));
        assert!(matches!(guard_create(false, MIN_STAKE - 1, k(1), k(2)), Err(OniError::BadStake)));
        assert!(matches!(guard_create(false, MIN_STAKE, k(1), k(1)), Err(OniError::SamePlayer)));
    }

    #[test]
    fn named_match_only_the_invited_wallet_can_join() {
        let (a, b, griefer) = (k(1), k(2), k(9));
        assert!(guard_join(false, MatchState::Open, a, b, b, false).is_ok());
        assert!(matches!(guard_join(false, MatchState::Open, a, b, griefer, false), Err(OniError::NotInvited)));
        // even a referee co-signature cannot let a stranger into a named match
        assert!(matches!(guard_join(false, MatchState::Open, a, b, griefer, true), Err(OniError::NotInvited)));
        assert!(matches!(guard_join(false, MatchState::Open, a, b, a, false), Err(OniError::SamePlayer)));
    }

    #[test]
    fn open_match_needs_the_referee_to_join() {
        let (a, b) = (k(1), k(2));
        assert!(matches!(guard_join(false, MatchState::Open, a, NONE, b, false), Err(OniError::NeedsReferee)));
        assert!(guard_join(false, MatchState::Open, a, NONE, b, true).is_ok());
        assert!(matches!(guard_join(false, MatchState::Open, a, NONE, a, true), Err(OniError::SamePlayer)));
    }

    #[test]
    fn join_only_once_and_not_while_paused() {
        let (a, b) = (k(1), k(2));
        for st in [MatchState::Ready, MatchState::Settled, MatchState::Cancelled, MatchState::Refunded] {
            assert!(matches!(guard_join(false, st, a, b, b, true), Err(OniError::WrongState)));
        }
        assert!(matches!(guard_join(true, MatchState::Open, a, b, b, false), Err(OniError::Paused)));
    }

    #[test]
    fn settle_and_refund_windows_are_exact_complements() {
        let t0 = 1_700_000_000i64;
        let dl = t0 + SETTLE_TIMEOUT_SECS;
        for now in [t0, t0 + 1, dl - 1, dl, dl + 1, dl + 86_400] {
            let s = guard_settle(MatchState::Ready, t0, now).is_ok();
            let r = guard_refund(MatchState::Ready, t0, now).is_ok();
            assert!(s ^ r, "exactly one of settle/refund at now={now}");
        }
        assert!(guard_settle(MatchState::Ready, t0, dl - 1).is_ok());
        assert!(matches!(guard_settle(MatchState::Ready, t0, dl), Err(OniError::TooLate)));
        assert!(matches!(guard_refund(MatchState::Ready, t0, dl - 1), Err(OniError::TooEarly)));
        assert!(guard_refund(MatchState::Ready, t0, dl).is_ok());
    }

    #[test]
    fn settle_and_refund_need_a_ready_match() {
        for st in [MatchState::Open, MatchState::Settled, MatchState::Cancelled, MatchState::Refunded] {
            assert!(matches!(guard_settle(st, 0, 1), Err(OniError::WrongState)));
            assert!(matches!(guard_refund(st, 0, i64::MAX), Err(OniError::WrongState)));
        }
    }

    #[test]
    fn deadline_math_is_checked() {
        assert!(settle_deadline(i64::MAX).is_none());
        assert!(matches!(guard_settle(MatchState::Ready, i64::MAX, 0), Err(OniError::Overflow)));
        assert!(matches!(guard_refund(MatchState::Ready, i64::MAX, i64::MAX), Err(OniError::Overflow)));
    }

    #[test]
    fn settle_lamport_flow_conserves_the_pot() {
        // match account holds rent + 2 x stake; prize -> winner, fee -> config, rest (rent) -> A on close
        let (rent, stake) = (1_500_000u64, 123_456_789u64);
        let owner = crate::ID;
        let (km, kw, kc) = (k(1), k(2), k(3));
        let (mut lm, mut lw, mut lc) = (rent + 2 * stake, 5u64, 7u64);
        let (mut d1, mut d2, mut d3) = ([0u8; 0], [0u8; 0], [0u8; 0]);
        let m = AccountInfo::new(&km, false, true, &mut lm, &mut d1, &owner, false, 0);
        let w = AccountInfo::new(&kw, false, true, &mut lw, &mut d2, &owner, false, 0);
        let c = AccountInfo::new(&kc, false, true, &mut lc, &mut d3, &owner, false, 0);
        let s = split(stake, 350).unwrap();
        move_lamports(&m, &w, s.prize).unwrap();
        move_lamports(&m, &c, s.fee).unwrap();
        assert_eq!(m.lamports(), rent, "only the rent is left for the close");
        assert_eq!(w.lamports(), 5 + s.prize);
        assert_eq!(c.lamports(), 7 + s.fee);
        // cannot take more than the account holds
        assert!(move_lamports(&m, &w, rent + 1).is_err());
        assert_eq!(m.lamports(), rent);
        move_lamports(&m, &w, 0).unwrap();
    }

    #[test]
    fn account_sizes_are_stable() {
        // the JS client and any indexer rely on these
        assert_eq!(8 + Config::INIT_SPACE, 8 + 32 * 6 + 1 + 8 * 3 + 1);
        assert_eq!(8 + Match::INIT_SPACE, 8 + 8 + 32 * 2 + 8 + 1 + 8 + 8 + 1);
    }

    #[test]
    fn print_discriminators() {
        use anchor_lang::Discriminator;
        use crate::instruction as ix;
        for (n, d) in [
            ("initialize_config", ix::InitializeConfig::DISCRIMINATOR), ("create_match", ix::CreateMatch::DISCRIMINATOR),
            ("join_match", ix::JoinMatch::DISCRIMINATOR), ("settle_match", ix::SettleMatch::DISCRIMINATOR),
            ("void_match", ix::VoidMatch::DISCRIMINATOR), ("cancel_match", ix::CancelMatch::DISCRIMINATOR),
            ("refund_expired", ix::RefundExpired::DISCRIMINATOR), ("withdraw_fees", ix::WithdrawFees::DISCRIMINATOR),
            ("set_paused", ix::SetPaused::DISCRIMINATOR), ("set_referee", ix::SetReferee::DISCRIMINATOR),
            ("set_fee_accounts", ix::SetFeeAccounts::DISCRIMINATOR), ("propose_admin", ix::ProposeAdmin::DISCRIMINATOR),
            ("accept_admin", ix::AcceptAdmin::DISCRIMINATOR),
        ] { println!("DISC {n} {d:?}"); }
    }
}

// ---------------------------------------------------------------- accounts

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub pending_admin: Pubkey, // two-step admin hand-over
    pub referee: Pubkey,       // the ONI game server key that reports verified results
    pub treasury: Pubkey,      // ONI share of the fee
    pub season_pot: Pubkey,    // 1%
    pub curse_pot: Pubkey,     // 0.5%
    pub paused: bool,
    pub fees_house: u64, // accrued, lamports held by this account on top of its rent
    pub fees_season: u64,
    pub fees_curse: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Match {
    pub match_id: u64,
    pub player_a: Pubkey,
    pub player_b: Pubkey, // named opponent, or default() while an open match is unjoined
    pub stake: u64,       // lamports per player; held by this account on top of its rent
    pub state: MatchState,
    pub created_at: i64,
    pub ready_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum MatchState { Open, Ready, Settled, Cancelled, Refunded }

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(init, payer = admin, space = 8 + Config::INIT_SPACE, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()) @ OniError::Unauthorized)]
    pub program: Program<'info, crate::program::OniEscrow>,
    #[account(constraint = program_data.upgrade_authority_address == Some(admin.key()) @ OniError::Unauthorized)]
    pub program_data: Account<'info, ProgramData>,
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
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    // seeds include the creator, so nobody can squat another player's match ids
    #[account(init, payer = player, space = 8 + Match::INIT_SPACE,
              seeds = [b"match".as_ref(), player.key().as_ref(), match_id.to_le_bytes().as_ref()], bump)]
    pub match_acc: Account<'info, Match>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"match".as_ref(), match_acc.player_a.as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump)]
    pub match_acc: Account<'info, Match>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// Required (as signer) only for open matches; pass None for a named opponent.
    pub referee: Option<Signer<'info>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleMatch<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = referee)]
    pub config: Account<'info, Config>,
    pub referee: Signer<'info>, // only the ONI server can report a result
    #[account(mut, close = player_a,
              seeds = [b"match".as_ref(), match_acc.player_a.as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump,
              has_one = player_a, has_one = player_b)]
    pub match_acc: Account<'info, Match>,
    /// CHECK: equals match.player_a (has_one); receives prize if A wins, plus the rent
    #[account(mut)] pub player_a: UncheckedAccount<'info>,
    /// CHECK: equals match.player_b (has_one)
    #[account(mut)] pub player_b: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct VoidMatch<'info> {
    #[account(seeds = [b"config"], bump = config.bump, has_one = referee)]
    pub config: Account<'info, Config>,
    pub referee: Signer<'info>,
    #[account(mut, close = player_a,
              seeds = [b"match".as_ref(), match_acc.player_a.as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump,
              has_one = player_a, has_one = player_b)]
    pub match_acc: Account<'info, Match>,
    /// CHECK: equals match.player_a (has_one)
    #[account(mut)] pub player_a: UncheckedAccount<'info>,
    /// CHECK: equals match.player_b (has_one)
    #[account(mut)] pub player_b: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(mut, close = player_a,
              seeds = [b"match".as_ref(), match_acc.player_a.as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump,
              has_one = player_a)]
    pub match_acc: Account<'info, Match>,
    #[account(mut)]
    pub player_a: Signer<'info>,
}

#[derive(Accounts)]
pub struct RefundExpired<'info> {
    #[account(mut, close = player_a,
              seeds = [b"match".as_ref(), match_acc.player_a.as_ref(), match_acc.match_id.to_le_bytes().as_ref()], bump = match_acc.bump,
              has_one = player_a, has_one = player_b)]
    pub match_acc: Account<'info, Match>,
    /// CHECK: equals match.player_a (has_one)
    #[account(mut)] pub player_a: UncheckedAccount<'info>,
    /// CHECK: equals match.player_b (has_one)
    #[account(mut)] pub player_b: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = treasury, has_one = season_pot, has_one = curse_pot)]
    pub config: Account<'info, Config>,
    /// CHECK: fixed by config
    #[account(mut)] pub treasury: UncheckedAccount<'info>,
    /// CHECK: fixed by config
    #[account(mut)] pub season_pot: UncheckedAccount<'info>,
    /// CHECK: fixed by config
    #[account(mut)] pub curse_pot: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetFeeAccounts<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
    /// CHECK: any wallet
    pub treasury: UncheckedAccount<'info>,
    /// CHECK: any wallet
    pub season_pot: UncheckedAccount<'info>,
    /// CHECK: any wallet
    pub curse_pot: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct AcceptAdmin<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    pub new_admin: Signer<'info>,
}

// ---------------------------------------------------------------- events and errors

#[event] pub struct MatchCreated { pub match_id: u64, pub player_a: Pubkey, pub opponent: Pubkey, pub stake: u64 }
#[event] pub struct MatchJoined { pub match_id: u64, pub player_a: Pubkey, pub player_b: Pubkey }
#[event] pub struct MatchSettled { pub match_id: u64, pub winner: Pubkey, pub prize: u64, pub fee: u64 }
#[event] pub struct MatchRefunded { pub match_id: u64, pub by_referee: bool }
#[event] pub struct MatchCancelled { pub match_id: u64 }
/// 1 paused, 2 unpaused, 3 referee, 4 fee accounts, 5 admin proposed, 6 admin accepted
#[event] pub struct ConfigChanged { pub what: u8 }

#[error_code]
pub enum OniError {
    #[msg("New matches are paused")] Paused,
    #[msg("Stake is below the minimum (0.001 SOL) or too large")] BadStake,
    #[msg("The match is not in the right state for this")] WrongState,
    #[msg("You cannot play against yourself")] SamePlayer,
    #[msg("That wallet is not a player of this match")] NotAPlayer,
    #[msg("Fee must be between 3% and 5%")] BadFee,
    #[msg("Math overflow")] Overflow,
    #[msg("The settle window is still open")] TooEarly,
    #[msg("The settle window is over: use refund_expired")] TooLate,
    #[msg("This match is for an invited opponent only")] NotInvited,
    #[msg("Joining an open match needs the referee's co-signature")] NeedsReferee,
    #[msg("Not allowed")] Unauthorized,
    #[msg("Key must not be the default pubkey")] BadKey,
}
