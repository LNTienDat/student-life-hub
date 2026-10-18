import { useEffect, useState } from 'react';
import { subscribeDataChanges } from '../services/dataEvents';

export default function useDataRevision() {
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeDataChanges(() => setRevision((value) => value + 1)), []);
  return revision;
}
