import { useLocalSearchParams } from 'expo-router';
import { CollectionScreen } from '../../screens/CollectionScreen';

export default function SpecialPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CollectionScreen kind="special" id={decodeURIComponent(id ?? '')} />;
}
