import { createFileRoute } from "@tanstack/react-router";
import { OsApp } from "@/mystic/Os";

export const Route = createFileRoute("/")({ component: OsApp });
