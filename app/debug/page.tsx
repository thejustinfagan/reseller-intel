import Database from 'better-sqlite3';
import path from 'path';

export default function DebugPage() {
  let data: { status: string; message: string; companies: any[]; total: number } = { status: 'error', message: 'Unknown error', companies: [], total: 0 };
  
  try {
    const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');
    const db = new Database(DB_PATH, { readonly: true });
    
    // Get total count
    const countResult = db.prepare('SELECT COUNT(*) as total FROM companies').get() as any;
    const total = countResult.total;
    
    // Get sample companies
    const companies = db.prepare('SELECT company_name, city, state, primary_phone FROM companies LIMIT 10').all();
    
    db.close();
    
    data = { status: 'success', message: 'Database working', companies, total };
  } catch (error: any) {
    data.message = error.message;
  }

  return (
    <html>
      <head>
        <title>Debug - Reseller Intel</title>
        <style>{`
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .success { color: green; }
          .error { color: red; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8f9fa; }
          .stats { background: #e8f4fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>🔧 Reseller Intel - Debug Page</h1>
          
          <div className="stats">
            <strong>Status:</strong> 
            <span className={data.status === 'success' ? 'success' : 'error'}>
              {data.status.toUpperCase()}
            </span>
            <br />
            <strong>Message:</strong> {data.message}
            <br />
            <strong>Total Companies:</strong> {data.total.toLocaleString()}
          </div>

          {data.status === 'success' && data.companies.length > 0 && (
            <>
              <h2>Sample Companies (10 records)</h2>
              <table>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Location</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {data.companies.map((company: any, i) => (
                    <tr key={i}>
                      <td>{company.company_name}</td>
                      <td>{company.city}, {company.state}</td>
                      <td>{company.primary_phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          
          <hr style={{ margin: '30px 0' }} />
          <p>
            <strong>Links:</strong><br />
            • <a href="/">Main App</a><br />
            • <a href="/api/companies?limit=5">API Test</a>
          </p>
        </div>
      </body>
    </html>
  );
}