import Twin from '@/components/twin';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-8 py-8">
        <div className="max-w-7xxl mx-auto">
          <div className="h-[600px]">
            <Twin />
          </div>
          {/* <footer className="mt-8 text-center text-sm text-gray-500">
            <p>Week 2: Building Your Digital Twin</p>
          </footer> */}
        </div>
      </div>
    </main>
  );
}