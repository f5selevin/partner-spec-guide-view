export type PageHeading = {
  id: string;
  label: string;
  level: number;
};

type Props = {
  headings: PageHeading[];
};

export function OnThisPage({ headings }: Props) {
  if (!headings.length) return null;

  return (
    <aside className="on-this-page" aria-label="On this page">
      <div className="on-this-page-title">On this page</div>
      <nav>
        <ul>
          {headings.map((heading) => (
            <li key={heading.id} className={`heading-level-${heading.level}`}>
              <a href={`#${heading.id}`}>{heading.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
