import Link from 'next/link';
import { Code2, FileJson, FileText, FileSpreadsheet, GitBranch, Star, Search } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: FileJson,
      title: 'JSON & YAML',
      description: 'Store and visualize JSON/YAML configurations with syntax highlighting',
    },
    {
      icon: FileSpreadsheet,
      title: 'CSV Data',
      description: 'Preview CSV datasets up to 1000 rows with sortable tables',
    },
    {
      icon: GitBranch,
      title: 'Version Control',
      description: 'Git-like history with diff views and easy rollback',
    },
    {
      icon: Star,
      title: 'Stars & Forks',
      description: 'Save favorites and fork snippets for your own use',
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center">
      <section className="w-full py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0070F3]/10">
              <Code2 className="h-8 w-8 text-[#0070F3]" />
            </div>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-[#EDEDED] md:text-5xl">
            Multi-Format Data Repository
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-[#888888]">
            Store, version, visualize and collaborate with data files in JSON, YAML, CSV, and more. 
            Built for Data Engineers, DevOps, and developers.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/new"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0070F3] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0051A8]"
            >
              Create Snippet
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#2A2A2A] bg-transparent px-6 py-2 text-sm font-medium text-[#EDEDED] transition-colors hover:bg-[#1A1A1A] hover:border-[#3A3A3A]"
            >
              <Search className="mr-2 h-4 w-4" />
              Explore
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-6 transition-all hover:border-[#3A3A3A]"
              >
                <feature.icon className="mb-4 h-6 w-6 text-[#0070F3]" />
                <h3 className="mb-2 text-base font-semibold text-[#EDEDED]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#888888]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-2xl font-semibold text-[#EDEDED]">
            Supported Formats
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['JSON', 'YAML', 'CSV', 'XML', 'TOML', 'INI', '.env', 'Markdown'].map((format) => (
              <span
                key={format}
                className="rounded-full border border-[#2A2A2A] bg-[#111111] px-4 py-1.5 text-sm font-medium text-[#888888]"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}