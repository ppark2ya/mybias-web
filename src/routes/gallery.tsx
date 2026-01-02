import { createFileRoute } from "@tanstack/react-router";
import { Gallery } from "../components/Gallery/Gallery";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  return <Gallery />;
}

export default GalleryPage;
