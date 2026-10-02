

export const MAPS = [
  "Erangel",
  "Miramar",
  "Rondo",
  "Haven",
  "Bind",
  "Split",
  "Ascent",
  "Icebox",
  "Breeze",
  "Fracture",
  "Pearl",
  "Lotus",
  "Sunset",
  "Other",
];

export function formatAdminMatchDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function getStageConfig(tournament, stageName) {
  return (
    (tournament?.stages || []).find((stage) => stage.name === stageName) || null
  );
}

export function getStageGroupOptions(stage) {
  const summary = String(stage?.summary || "");
  const rangeMatch = summary.match(/Groups?\s+([A-Z])\s*-\s*([A-Z])/i);
  if (rangeMatch) {
    const start = rangeMatch[1].toUpperCase().charCodeAt(0);
    const end = rangeMatch[2].toUpperCase().charCodeAt(0);
    return Array.from(
      { length: end - start + 1 },
      (_, index) => `Group ${String.fromCharCode(start + index)}`,
    );
  }

  const countMatch = summary.match(/(\d+)\s+groups?/i);
  if (countMatch) {
    const count = Number(countMatch[1]);
    if (Number.isFinite(count) && count > 1 && count <= 8) {
      return Array.from(
        { length: count },
        (_, index) => `Group ${String.fromCharCode(65 + index)}`,
      );
    }
  }

  const rotationRows = Array.isArray(stage?.mapRotation)
    ? stage.mapRotation
    : [];
  const rotationGroups = new Set();
  rotationRows.forEach((row) => {
    Object.entries(row || {}).forEach(([key, value]) => {
      if (!/^day\d+$/i.test(key)) return;
      const normalized = String(value || "")
        .trim()
        .toUpperCase();
      if (normalized) rotationGroups.add(`Group ${normalized}`);
    });
  });

  if (rotationGroups.size > 0) {
    return Array.from(rotationGroups).toSorted();
  }

  return [];
}

export function buildMatchKey(match) {
  return [
    match.tournament_id,
    match.stage,
    match.group_name || "",
    String(match.day || 0),
    String(match.match_number || 0),
  ].join("::");
}

function getRotationGroups(stage, day) {
  const rows = Array.isArray(stage?.mapRotation) ? stage.mapRotation : [];
  const key = `day${day}`;
  return [
    ...new Set(
      rows.flatMap((row) => {
        const value = String(row?.[key] || "")
          .trim()
          .toUpperCase();
        return value ? [`Group ${value}`] : [];
      }),
    ),
  ];
}

export function getRotationGroupLabel(stage, day) {
  const groups = getRotationGroups(stage, day);
  if (groups.length === 0) return "";
  if (groups.length === 1) return groups[0];
  return groups.join(" + ");
}

function getRotationRowsForDay(stage, day, requestedGroupName) {
  const rows = Array.isArray(stage?.mapRotation) ? stage.mapRotation : [];
  const key = `day${day}`;
  const normalizedRequestedGroup = String(requestedGroupName || "")
    .trim()
    .toLowerCase()
    .replace(/^group\s+/i, "");

  if (!rows.length) return [];

  return rows.filter((row) => {
    const cellValue = String(row?.[key] || "")
      .trim()
      .toLowerCase();
    if (!cellValue) return false;
    if (!normalizedRequestedGroup) return true;
    return cellValue === normalizedRequestedGroup;
  });
}

export function buildAutoSchedulePreview(autoForm, tournament, stageConfig) {
  if (!tournament || !stageConfig || !autoForm.stage) {
    return { entries: [], error: "Choose a tournament and stage first." };
  }

  const day = Number(autoForm.day);
  if (!Number.isFinite(day) || day <= 0) {
    return { entries: [], error: "Enter a valid day number." };
  }

  const intervalMinutes = Math.max(1, Number(autoForm.interval_minutes) || 45);
  const startMatch = Number(autoForm.starting_match_number);
  const source = autoForm.source || "rotation";
  const base = {
    tournament_id: tournament.id,
    stage: autoForm.stage,
    status: autoForm.status || "scheduled",
    stream_url: autoForm.stream_url || "",
    day,
  };

  if (source === "rotation") {
    const rotationRows = Array.isArray(stageConfig.mapRotation)
      ? stageConfig.mapRotation
      : [];
    if (!rotationRows.length) {
      return {
        entries: [],
        error: "This stage does not have stored map rotation data yet.",
      };
    }

    const inferredGroup =
      autoForm.group_name || getRotationGroupLabel(stageConfig, day);
    const rotationGroups = getRotationGroups(stageConfig, day);
    if (!autoForm.group_name && rotationGroups.length === 0) {
      return {
        entries: [],
        error: `No rotation group is mapped for Day ${day}.`,
      };
    }

    const dayRows = getRotationRowsForDay(
      stageConfig,
      day,
      autoForm.group_name,
    );
    if (!dayRows.length) {
      return {
        entries: [],
        error: autoForm.group_name
          ? `No rotation rows found for ${autoForm.group_name} on Day ${day}.`
          : `No rotation rows found on Day ${day}.`,
      };
    }

    const entries = dayRows.map((row, index) => {
      const scheduledTime = autoForm.start_time
        ? new Date(
            new Date(autoForm.start_time).getTime() +
              index * intervalMinutes * 60 * 1000,
          ).toISOString()
        : "";
      const rowGroupValue = String(row?.[`day${day}`] || "")
        .trim()
        .toUpperCase();
      const rowMap = day === 4 && row.day4Map ? row.day4Map : row.map;
      return { ...base,
        group_name: rowGroupValue
          ? `Group ${rowGroupValue}`
          : autoForm.group_name || "",
        match_number:
          Number.isFinite(startMatch) && startMatch > 0
            ? startMatch + index
            : Number(row.match) || index + 1,
        map: rowMap || "Other",
        scheduled_time: scheduledTime,
      };
    });

    return { entries, error: "", inferredGroup };
  }

  const maps = String(autoForm.custom_maps || "")
    .split(/[\n,]/)
    .flatMap((value) => {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    });

  if (!maps.length) {
    return {
      entries: [],
      error: "Enter one or more maps for custom generation.",
    };
  }

  const entries = maps.map((map, index) => {
    const scheduledTime = autoForm.start_time
      ? new Date(
          new Date(autoForm.start_time).getTime() +
            index * intervalMinutes * 60 * 1000,
        ).toISOString()
      : "";
    return {
      ...base,
      group_name: autoForm.group_name || "",
      match_number:
        Number.isFinite(startMatch) && startMatch > 0
          ? startMatch + index
          : index + 1,
      map,
      scheduled_time: scheduledTime,
    };
  });

  return { entries, error: "", inferredGroup: "" };
}
