export default function AssessmentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Assessment {params.id}</h1>
      <p>Assessment detail page content goes here.</p>
    </div>
  );
}
