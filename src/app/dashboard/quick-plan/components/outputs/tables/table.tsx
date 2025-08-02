const people = [
  { name: 'Lindsay Walton', title: 'Front-end Developer', email: 'lindsay.walton@example.com', role: 'Member' },
  { name: 'Courtney Henry', title: 'Designer', email: 'courtney.henry@example.com', role: 'Admin' },
  { name: 'Tom Cook', title: 'Director of Product', email: 'tom.cook@example.com', role: 'Member' },
  { name: 'Whitney Francis', title: 'Copywriter', email: 'whitney.francis@example.com', role: 'Admin' },
  { name: 'Leonard Krasner', title: 'Senior Designer', email: 'leonard.krasner@example.com', role: 'Owner' },
  { name: 'Floyd Miles', title: 'Principal Designer', email: 'floyd.miles@example.com', role: 'Member' },
];

export default function Table() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="divide-border relative min-w-full divide-y">
              <thead>
                <tr className="text-foreground">
                  <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold sm:pl-6 lg:pl-8">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                    Title
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                    Role
                  </th>
                  <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-6 lg:pr-8">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {people.map((person) => (
                  <tr key={person.email}>
                    <td className="text-foreground py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap sm:pl-6 lg:pl-8">{person.name}</td>
                    <td className="text-muted-foreground px-3 py-4 text-sm whitespace-nowrap">{person.title}</td>
                    <td className="text-muted-foreground px-3 py-4 text-sm whitespace-nowrap">{person.email}</td>
                    <td className="text-muted-foreground px-3 py-4 text-sm whitespace-nowrap">{person.role}</td>
                    <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6 lg:pr-8">
                      <a href="#" className="text-primary hover:text-primary/75">
                        Edit<span className="sr-only">, {person.name}</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
