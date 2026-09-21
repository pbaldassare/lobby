import { Redirect } from 'expo-router';

/** Il match vive sulle persone in home, solo in stanza e solo se visibile. */
export default function MatchesRedirect(): React.JSX.Element {
  return <Redirect href="/(app)/(tabs)/discover" />;
}
