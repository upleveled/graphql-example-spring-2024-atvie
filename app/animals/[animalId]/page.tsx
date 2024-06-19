import Image from 'next/image';
import Link from 'next/link';
import { getAnimalInsecure } from '../../../database/animals';

type Props = {
  params: { animalId: string };
};

export default async function AnimalPage(props: Props) {
  const animal = await getAnimalInsecure(Number(props.params.animalId));

  if (!animal) {
    return (
      <div>
        <h1>Animal not found</h1>
        <Link href="/animals">Go back to animals</Link>
      </div>
    );
  }

  return (
    <div>
      This is a single animal page
      <h1>{animal.firstName}</h1>
      <Image
        src={`/images/${animal.firstName}.png`}
        width={200}
        height={200}
        alt={animal.firstName}
      />
      this is a {animal.type} carrying {animal.accessory}
    </div>
  );
}
