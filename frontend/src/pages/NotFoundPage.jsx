import{Link}from'react-router-dom';
export default function NotFoundPage(){return(
  <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
    <div className="text-8xl mb-6">🏚️</div>
    <h1 className="text-4xl font-extrabold text-[#1a2e23] mb-3">404</h1>
    <h2 className="text-xl font-bold text-[#1a2e23] mb-3">Page Not Found</h2>
    <p className="text-sm text-[#5a6e63] max-w-sm mb-8">This page doesn't exist. Maybe the listing expired, or the URL is wrong.</p>
    <div className="flex gap-3 flex-wrap justify-center">
      <Link to="/" className="btn btn-primary">Go Home</Link>
      <Link to="/listings" className="btn btn-outline">Browse Listings</Link>
    </div>
  </div>
);}
