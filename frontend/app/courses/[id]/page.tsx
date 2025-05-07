import { useParams } from 'next/navigation';

export default function CoursePage() {
  const params = useParams();
  const courseId = params.id;

  return <h1>Detalls del curs: {courseId}</h1>;
}