import { business } from "@/src/content/business";
export function BusinessFooter() {
  return <footer className="foot"><span>{business.name}</span><span>{business.contactLine}</span></footer>;
}
