import { useLocalSearchParams } from 'expo-router';
import { CollectionScreen } from '../../screens/CollectionScreen';

export default function TeamPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CollectionScreen kind="team" id={id ?? ''} />;
}
