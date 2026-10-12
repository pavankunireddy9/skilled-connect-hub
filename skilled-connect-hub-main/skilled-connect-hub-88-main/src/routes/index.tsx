import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, MapPin, Search, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { categories } from "@/lib/api";
import serviceImage from "@/assets/taskhive-service.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "TaskHive — Find local service providers" },
    { name: "description", content: "Find independent local service providers, request a visit, and manage your bookings with TaskHive." },
    { property: "og:title", content: "TaskHive — Find local service providers" },
    { property: "og:description", content: "Find independent local service providers, request a visit, and manage your bookings with TaskHive." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Landing,
});

function Landing() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const search = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) sessionStorage.setItem("taskhive-search", query.trim());
    navigate({ to: "/customer/browse" });
  };
  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Wrench className="size-5" /></span>TaskHive</Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-4"><ThemeToggle /><Link to="/auth" className="text-sm font-medium hover:text-primary">Sign in</Link><Button asChild size="sm"><Link to="/auth">Get started <ArrowRight className="size-4" /></Link></Button></nav>
      </div>
    </header>
    <main>
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-xs font-semibold uppercase text-muted-foreground">Local help, made easier</p>
          <h1 className="font-display text-5xl font-semibold leading-tight sm:text-6xl">TaskHive</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">Find skilled independent service providers for your home or workplace. Choose the work you need and send a request directly.</p>
          <form onSubmit={search} className="mx-auto mt-9 flex max-w-2xl flex-col gap-2 border border-border bg-card p-2 shadow-sm sm:flex-row">
            <label className="flex flex-1 items-center gap-3 px-3"><Search className="size-5 shrink-0 text-muted-foreground" /><span className="sr-only">Search services</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you need help with?" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label>
            <Button type="submit" className="h-12 px-7">Find help <ArrowRight className="size-4" /></Button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2"><span className="mr-1 text-sm text-muted-foreground">Explore services</span>{categories.slice(0, 5).map((category) => <Button key={category.id} asChild size="sm" variant="outline"><Link to="/customer/browse" search={{ category: category.id }}>{category.name}</Link></Button>)}</div>
        </div>
      </section>
      <section className="relative mx-auto h-[340px] max-w-7xl overflow-hidden sm:h-[440px]" aria-label="Electrician working in a customer's home"><img src={serviceImage} alt="Electrician helping a customer at home" width={1600} height={900} className="h-full w-full object-cover object-center" /><div className="absolute bottom-5 left-5 max-w-xs bg-card/95 p-5 text-sm shadow-md sm:bottom-8 sm:left-8"><p className="font-display text-xl font-semibold">Work that gets done</p><p className="mt-1 text-muted-foreground">Send a request with your location and preferred time.</p></div></section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-20">
        <div><MapPin className="size-7 text-primary" /><h2 className="mt-4 font-display text-2xl font-semibold">Looking for help?</h2><p className="mt-3 max-w-md text-muted-foreground">Browse available providers, view their profiles and prices, and book a visit at the address you choose.</p><Button asChild variant="outline" className="mt-5"><Link to="/customer/browse">Browse providers <ArrowRight className="size-4" /></Link></Button></div>
        <div><BriefcaseBusiness className="size-7 text-primary" /><h2 className="mt-4 font-display text-2xl font-semibold">Offering a service?</h2><p className="mt-3 max-w-md text-muted-foreground">Create your profile, set your working area and availability, and manage requests in one place.</p><Button asChild variant="outline" className="mt-5"><Link to="/auth">Join as a provider <ArrowRight className="size-4" /></Link></Button></div>
      </section>
      <section className="border-y border-border bg-secondary/50"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-8 sm:px-8"><ShieldCheck className="size-6 text-primary" /><p className="text-sm text-muted-foreground">Provider verification appears on profiles when it has been completed. Always review a provider's details before booking.</p></div></section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:px-8"><span>© {new Date().getFullYear()} TaskHive</span><Link to="/auth" className="hover:text-foreground">Sign in or create an account</Link></footer>
  </div>;
}
