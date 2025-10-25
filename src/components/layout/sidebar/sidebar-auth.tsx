import Image from 'next/image';

export default function SidebarAuth() {
  return (
    <a
      href="#"
      className="hover:bg-background border-border/50 focus-visible:ring-primary flex items-center border-t border-dashed py-3 pl-4 text-base/6 font-semibold focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
    >
      <Image
        alt=""
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        className="size-8 shrink-0 rounded-full"
        width={32}
        height={32}
      />
      <span className="sr-only">Your profile</span>
      <span className="ml-2 inline group-data-[state=collapsed]/sidebar:hidden" aria-hidden="true">
        Tom Cook
      </span>
    </a>
  );
}
