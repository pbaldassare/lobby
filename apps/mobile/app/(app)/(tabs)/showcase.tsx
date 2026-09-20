import { Redirect } from 'expo-router';

/** I progetti stanno sul profilo, non su un tab proprio. */
export default function ShowcaseRedirect(): React.JSX.Element {
  return <Redirect href="/(app)/(tabs)/card" />;
}
