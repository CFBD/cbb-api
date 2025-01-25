interface PlayerStats {
  points: number | null;
  '2pa': number | null;
  '2pm': number | null;
  '2pPct': string | null;
  '3pa': number | null;
  '3pm': number | null;
  '3pPct': string | null;
  ast: number | null;
  blk: number | null;
  dreb: number | null;
  efg: string | null;
  fga: number | null;
  fgm: number | null;
  fgPct: string | null;
  fta: number | null;
  ftm: number | null;
  ftPct: string | null;
  oreb: number | null;
  pf: number | null;
  reb: number | null;
  stl: number | null;
  to: number | null;
  trueShooting: string | null;
  minutes: number | null;
}

interface TeamStats {
  points: number | null;
  opponentPoints: number | null;
  team2pm: number | null;
  team2pa: number | null;
  team2pPct: string | null;
  team3pm: number | null;
  team3pa: number | null;
  team3pPct: string | null;
  teamFtm: number | null;
  teamFta: number | null;
  teamFtPct: string | null;
  teamFgm: number | null;
  teamFga: number | null;
  teamFgPct: string | null;
  teamOreb: number | null;
  teamDreb: number | null;
  teamReb: number | null;
  teamAst: number | null;
  teamStl: number | null;
  teamBlk: number | null;
  teamTo: number | null;
  teamTto: number | null;
  teamToto: number | null;
  teamPf: number | null;
  teamTech: number | null;
  teamFlag: number | null;
  teamPossessions: number | null;
  teamPointsFastBreak: number | null;
  teamPointsInPaint: number | null;
  teamPointsOffTo: number | null;
  teamTrueShooting: string | null;
  teamEfg: string | null;
  teamLargestLead: number | null;
  opponent2pm: number | null;
  opponent2pa: number | null;
  opponent2pPct: string | null;
  opponent3pm: number | null;
  opponent3pa: number | null;
  opponent3pPct: string | null;
  opponentFtm: number | null;
  opponentFta: number | null;
  opponentFtPct: string | null;
  opponentFgm: number | null;
  opponentFga: number | null;
  opponentFgPct: string | null;
  opponentOreb: number | null;
  opponentDreb: number | null;
  opponentReb: number | null;
  opponentAst: number | null;
  opponentStl: number | null;
  opponentBlk: number | null;
  opponentTo: number | null;
  opponentTto: number | null;
  opponentToto: number | null;
  opponentPf: number | null;
  opponentTech: number | null;
  opponentFlag: number | null;
  opponentPossessions: number | null;
  opponentPointsFastBreak: number | null;
  opponentPointsInPaint: number | null;
  opponentPointsOffTo: number | null;
  opponentTrueShooting: string | null;
  opponentEfg: string | null;
  opponentLargestLead: number | null;
}

export function getUsage(
  player: PlayerStats,
  team: TeamStats,
  gameMinutes: number | null,
) {
  if (
    player.fga !== null &&
    player.fta !== null &&
    player.to !== null &&
    player.minutes !== null &&
    player.minutes >= 8 &&
    gameMinutes !== null &&
    team.teamFga !== null &&
    team.teamFta !== null &&
    team.teamTo !== null
  ) {
    return (
      Math.round(
        1000 *
          (((player.fga + 0.44 * player.fta + player.to) * gameMinutes) /
            (player.minutes *
              (team.teamFga + 0.44 * team.teamFta + team.teamTo))),
      ) / 10
    );
  }

  return null;
}
export function getPlayerOffensiveRating(
  player: PlayerStats,
  team: TeamStats,
  gameMinutes: number,
) {
  if (
    gameMinutes !== null &&
    player.minutes !== null &&
    player.minutes >= 8 &&
    player.ast !== null &&
    player.fta !== null &&
    player.fgm !== null &&
    player.points !== null &&
    player.fga !== null &&
    player.ftm !== null &&
    player.oreb !== null &&
    player.to !== null &&
    player['3pm'] !== null &&
    team.teamAst !== null &&
    team.teamFgm !== null &&
    team.teamFgm !== null &&
    team.points !== null &&
    team.teamFtm !== null &&
    team.teamFga !== null &&
    team.teamOreb !== null &&
    team.teamReb !== null &&
    team.opponentReb !== null &&
    team.opponentOreb !== null &&
    team.teamFta !== null &&
    team.teamTo !== null &&
    team.team3pm !== null
  ) {
    const qAST =
      (player.minutes / gameMinutes) *
        (1.14 * ((team.teamAst - player.ast) / team.teamFgm)) +
      (((team.teamAst / (gameMinutes * 5)) * player.minutes * 5 - player.ast) /
        ((team.teamFgm / (gameMinutes * 5)) * player.minutes * 5 -
          player.fgm)) *
        (1 - player.minutes / gameMinutes);

    const fgPart =
      player.fgm *
      (1 - 0.5 * ((player.points - player.ftm) / (2 * player.fga)) * qAST);
    const astPart =
      0.5 *
      ((team.points - team.teamFtm - (player.points - player.ftm)) /
        (2 * (team.teamFga - player.fga))) *
      player.ast;
    const ftPart =
      (1 - Math.pow(1 - player.ftm / (player.fta > 0 ? player.fta : 1), 2)) *
      0.4 *
      player.fta;
    const teamScoringPoss = team.teamFgm + ftPart;
    const teamOrebPct =
      team.teamOreb / (team.teamOreb + (team.opponentReb - team.opponentOreb));
    const teamPlayPct =
      teamScoringPoss / (team.teamFga + team.teamFta * 0.4 + team.teamTo);
    const teamOrebWeight =
      ((1 - teamOrebPct) * teamPlayPct) /
      ((1 - teamOrebPct) * teamPlayPct + teamOrebPct * (1 - teamPlayPct));
    const orebPart = player.oreb * teamOrebWeight * teamPlayPct;

    const scoringPossessions =
      (fgPart + astPart + ftPart) *
        (1 - (team.teamOreb / teamScoringPoss) * teamOrebWeight * teamPlayPct) +
      orebPart;
    const missedFgPoss = (player.fga - player.fgm) * (1 - 1.07 * teamOrebPct);
    const missedFtPoss =
      Math.pow(1 - player.ftm / (player.fta > 0 ? player.fta : 1), 2) *
      0.4 *
      player.fta;

    const totPoss =
      scoringPossessions + missedFgPoss + missedFtPoss + player.to;
    const pprodFgPart =
      2 *
      (player.fgm + 0.5 * player['3pm']) *
      (1 - 0.5 * ((player.points - player.ftm) / (2 * player.fga)) * qAST);
    const pprodAstPart =
      2 *
      ((team.teamFgm - player.fgm + 0.5 * (team.team3pm - player['3pm'])) /
        (team.teamFgm - player.fgm)) *
      0.5 *
      ((team.points - team.teamFtm - (player.points - player.ftm)) /
        (2 * (team.teamFga - player.fga))) *
      player.ast;
    const pprodOrebPart =
      player.oreb *
      teamOrebWeight *
      teamPlayPct *
      (team.points /
        (team.teamFgm +
          (1 - Math.pow(1 - team.teamFtm / team.teamFta, 2)) *
            0.4 *
            team.teamFta));

    const pprod =
      (pprodFgPart + pprodAstPart + player.ftm) *
        (1 - (team.teamOreb / teamScoringPoss) * teamOrebWeight * teamPlayPct) +
      pprodOrebPart;

    return Math.round(1000 * (pprod / totPoss)) / 10;
  }

  return null;
}
export function getPlayerDefensiveRating(
  player: PlayerStats,
  team: TeamStats,
  gameMinutes: number,
) {
  if (
    player.stl !== null &&
    player.blk !== null &&
    player.minutes !== null &&
    player.minutes >= 8 &&
    player.pf !== null &&
    team.teamPossessions !== null &&
    team.teamPf !== null &&
    team.teamStl !== null &&
    team.teamBlk !== null &&
    team.teamDreb !== null &&
    team.opponentOreb !== null &&
    team.opponentFgm !== null &&
    team.opponentFga !== null &&
    team.opponentTo !== null &&
    team.opponentFta !== null &&
    team.opponentFtm !== null &&
    team.opponentPoints !== null
  ) {
    const dor = team.opponentOreb / (team.opponentOreb + team.teamDreb);
    const dfg = team.opponentFgm / team.opponentFga;
    const fmWeight = (dfg * (1 - dor)) / (dfg * (1 - dor) + (1 - dfg) * dor);
    const stops1 =
      player.stl +
      player.blk * fmWeight * (1 - 1.07 * dor) +
      team.teamDreb * (1 - fmWeight);

    const stops2 =
      (((team.opponentFga - team.opponentFgm - team.teamBlk) /
        (gameMinutes * 5)) *
        fmWeight *
        (1 - 1.07 * dor) +
        (team.opponentTo - team.teamStl) / (gameMinutes * 5)) *
        player.minutes +
      (player.pf / team.teamPf) *
        0.4 *
        team.opponentFta *
        Math.pow(1 - team.opponentFtm / team.opponentFta, 2);

    const stops = stops1 + stops2;
    const stopPct =
      (stops * (gameMinutes * 5)) / (team.teamPossessions * player.minutes);

    const teamDRtg = (100 * team.opponentPoints) / team.teamPossessions;
    const dPtsPerScoringPossession =
      team.opponentPoints /
      (team.opponentFgm +
        (1 - Math.pow(1 - team.opponentFtm / team.opponentFta, 2)) *
          0.4 *
          team.opponentFta);

    return (
      Math.round(
        (teamDRtg +
          0.2 * (100 * dPtsPerScoringPossession * (1 - stopPct) - teamDRtg)) *
          10,
      ) / 10
    );
  }

  return null;
}
