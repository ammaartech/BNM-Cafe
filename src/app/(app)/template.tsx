// A CSS entrance, not a JS one: it plays as soon as the HTML is parsed, so a
// server-rendered page is never held invisible while JavaScript loads.
export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col flex-grow h-full animate-in fade-in slide-in-from-bottom-2 duration-150 ease-out">
            {children}
        </div>
    );
}
