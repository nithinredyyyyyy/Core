import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractGroupToken,
  extractGroupTokens,
  groupTokensOverlap,
  scopeMatchParticipants,
} from "../../src/lib/teamScope.js";

const GROUP_A_PARTICIPANTS = [
  "AG.AL International",
  "Yangon Galacticos",
  "ThunderTalk Gaming",
  "Tianba",
  "XForce Rejects",
  "Alpha7 Esports",
  "FURIA Esports",
  "Wolves Esports",
  "Aurora Gaming",
  "Godlike Esports",
  "GOAT Team",
  "TT Project",
  "Kiwoom DRX",
  "DOPENESS",
  "Orangutan",
  "721 Esports",
];

const GROUP_B_PARTICIPANTS = [
  "AlUla Club Esports",
  "ETSH Esports",
  "Geekay Esports",
  "Nongshim Redforce",
  "Nigma Galaxy",
  "Horaa Esports",
  "4thrives Esports",
  "Bigetron by Vitality",
  "RRQ RYU",
  "eArena",
  "Team Flash",
  "IDA Esports",
  "Gaming Stars Esports",
  "S2G Esports",
  "ULF Esports",
  "Hustler Crew",
];

function participantsFor(groupPhase, names) {
  return names.map((team, index) => ({
    placement: index + 1,
    team,
    phase: groupPhase,
    qualification: "Test",
    seed: "1st",
  }));
}

function makeTeams(names) {
  return names.map((name) => ({ id: name, name }));
}

test("extractGroupToken matches the LAST group token", () => {
  assert.equal(extractGroupToken("Group Stage - Group A"), "a");
  assert.equal(extractGroupToken("Group Stage - Group B"), "b");
  assert.equal(extractGroupToken("Round 1 - Group D"), "d");
  assert.equal(extractGroupToken("Group A - Group B"), "b");
  assert.equal(extractGroupToken("Group B"), "b");
});

test("extractGroupToken falls back to a bare letter or raw text", () => {
  assert.equal(extractGroupToken("A"), "a");
  assert.equal(extractGroupToken("Semi Finals"), "semi finals");
  assert.equal(extractGroupToken(""), "");
  assert.equal(extractGroupToken("Grand Finals"), "grand finals");
});

test("extractGroupToken does not mistake the word Group for a group letter", () => {
  assert.equal(extractGroupToken("Group Stage"), "stage");
  assert.equal(extractGroupToken("Group Stage"), "stage");
});

test("extractGroupTokens expands letter runs", () => {
  assert.deepEqual(extractGroupTokens("a"), ["a"]);
  assert.deepEqual(extractGroupTokens("Group A"), ["a"]);
  assert.deepEqual(extractGroupTokens("abcd"), ["a", "b", "c", "d"]);
  assert.deepEqual(extractGroupTokens("Group A - Group B"), ["b"]);
  assert.deepEqual(extractGroupTokens("Semi Finals"), ["semi finals"]);
  assert.deepEqual(extractGroupTokens(""), []);
});

test("groupTokensOverlap", () => {
  assert.equal(groupTokensOverlap("Group A", "Group Stage - Group A"), true);
  assert.equal(groupTokensOverlap("Group A", "Group Stage - Group B"), false);
  assert.equal(groupTokensOverlap("Group B", "Group Stage - Group B"), true);
  assert.equal(groupTokensOverlap("", "Group A"), false);
  assert.equal(groupTokensOverlap("Group A", ""), false);
});

test("scopeMatchParticipants scopes Group Stage matches to their group", () => {
  const allParticipants = [
    ...participantsFor("Group Stage - Group A", GROUP_A_PARTICIPANTS),
    ...participantsFor("Group Stage - Group B", GROUP_B_PARTICIPANTS),
  ];
  const teams = makeTeams([...GROUP_A_PARTICIPANTS, ...GROUP_B_PARTICIPANTS]);

  const groupA = scopeMatchParticipants({
    participants: allParticipants,
    teams,
    stage: "Group Stage",
    groupName: "Group A",
  });
  assert.equal(groupA.scopedParticipants.length, 16);
  assert.equal(groupA.resolvedTeams.length, 16);
  assert.deepEqual(
    groupA.resolvedTeams.map((team) => team.name).sort(),
    [...GROUP_A_PARTICIPANTS].sort(),
  );

  const groupB = scopeMatchParticipants({
    participants: allParticipants,
    teams,
    stage: "Group Stage",
    groupName: "Group B",
  });
  assert.equal(groupB.resolvedTeams.length, 16);
  assert.deepEqual(
    groupB.resolvedTeams.map((team) => team.name).sort(),
    [...GROUP_B_PARTICIPANTS].sort(),
  );
});

test("scopeMatchParticipants filters participants whose team row is missing", () => {
  const allParticipants = participantsFor("Group Stage - Group A", GROUP_A_PARTICIPANTS);
  const teams = makeTeams(GROUP_A_PARTICIPANTS.filter((name) => name !== "Orangutan"));

  const result = scopeMatchParticipants({
    participants: allParticipants,
    teams,
    stage: "Group Stage",
    groupName: "Group A",
  });
  assert.equal(result.scopedParticipants.length, 16);
  assert.equal(result.resolvedTeams.length, 16);
  const orangutanTeam = result.resolvedTeams.find((team) => team.name === "Orangutan");
  assert.ok(orangutanTeam);
  assert.ok(String(orangutanTeam.id).startsWith("virtual:"));
});

test("scopeMatchParticipants falls back to all participants without a stage", () => {
  const allParticipants = participantsFor("Participants", GROUP_A_PARTICIPANTS);
  const teams = makeTeams(GROUP_A_PARTICIPANTS);

  const result = scopeMatchParticipants({ participants: allParticipants, teams });
  assert.equal(result.effectiveParticipants.length, 16);
  assert.equal(result.resolvedTeams.length, 16);
});

test("scopeMatchParticipants scopes by bare stage name", () => {
  const participants = [
    ...participantsFor("Grand Finals", ["Team One", "Team Two"]),
    ...participantsFor("Semi Finals", ["Team Three"]),
  ];
  const teams = makeTeams(["Team One", "Team Two", "Team Three"]);

  const result = scopeMatchParticipants({
    participants,
    teams,
    stage: "Grand Finals",
  });
  assert.deepEqual(result.resolvedTeams.map((team) => team.name).sort(), [
    "Team One",
    "Team Two",
  ]);
});
