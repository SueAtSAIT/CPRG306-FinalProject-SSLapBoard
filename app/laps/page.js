import Lapboard from "./lapboard";

export default function Page() {
  // TODO: signalR connection
  // TODO: settings (number colours, dark mode)

  return (
    <div className="w-screen h-screen bg-white overflow-hidden relative">
      <Lapboard />
    </div>
  );
}
