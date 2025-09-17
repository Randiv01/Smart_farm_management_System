import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../../lib/urls";

export default function AnimalDetail() {
  const { id } = useParams();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const res = await fetch(`${API_BASE}/animals/${id}`);
        if (!res.ok) throw new Error("Failed to fetch animal");
        const data = await res.json();
        setAnimal(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimal();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!animal) return <div className="p-6">Animal not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-3">Animal Details</h1>
      <p><strong>Animal ID:</strong> {animal.animalId}</p>
      <p><strong>Zone:</strong> {animal.assignedZone?.name || "Not assigned"}</p>
      {Object.entries(animal.data || {}).map(([key, val]) => (
        <p key={key}><strong>{key}:</strong> {val}</p>
      ))}
      <Link to="/AnimalManagement" className="mt-4 inline-block text-blue-600 underline">
        Back to Animal Management
      </Link>
    </div>
  );
}
