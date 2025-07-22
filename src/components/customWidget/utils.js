export const getEventIcon = (name) => {
  name = name?.trim();
  name = name?.substring(0, name.indexOf(" - "));

  if (name.includes("Basketball")) {
    return window.location.origin + `/images/league/basketball.png`;
  } else if (name.includes('Football')) {
    return window.location.origin + `/images/league/football.png`;
  } else if (name.includes('IceHockey')) {
    return window.location.origin + `/images/league/icehockey.png`;
  }

  // check league image by possible name
  let leagueIcon = window.location.origin + `/images/league/${name}.png`;
  // in case when image not found
  leagueIcon = leagueIcon.replace('/league/.png', '/no-image-icon.png');
  return leagueIcon;
};

export const formatEvent = (eventName) => {
  const parts = eventName.split(' - ');
  if (parts.length > 2) {
    return `${parts[1]} - ${parts[2]}`;
  }
  return eventName;
};

export const formatEventName = (eventName) => {
  const parts = eventName.split(' - ');
  if (parts.length > 1) {
    return parts[1];  // Return only the league name
  }
  return eventName;  // Return the original name if splitting doesn't result in multiple parts
};