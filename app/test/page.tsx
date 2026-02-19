// Simple server-side rendered test page
export default async function TestPage() {
  try {
    // Fetch data server-side
    const response = await fetch('/api/companies?limit=10', {
      headers: { 'User-Agent': 'Reseller-Intel-TestPage' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const companies = data.companies || [];
    const totalCount = data.pagination?.totalCount || data.totalCount || 0;

    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>🧪 Reseller Intel - Test Page</h1>
        <p><strong>Status:</strong> ✅ API Working</p>
        <p><strong>Total Companies:</strong> {totalCount.toLocaleString()}</p>
        <p><strong>Sample Data (10 records):</strong></p>
        
        {companies.length > 0 ? (
          <div>
            {companies.map((company: any) => (
              <div key={company.id} style={{ 
                border: '1px solid #ccc', 
                margin: '10px 0', 
                padding: '10px',
                borderRadius: '5px'
              }}>
                <h3>{company.company_name}</h3>
                <p><strong>Location:</strong> {company.city}, {company.state} {company.zip_code}</p>
                <p><strong>Phone:</strong> {company.primary_phone}</p>
                <p><strong>Service:</strong> {company.input_service_type} - {company.input_sub_service_type}</p>
                <details>
                  <summary>Features</summary>
                  <p style={{ fontSize: '12px', color: '#666' }}>{company.features}</p>
                </details>
              </div>
            ))}
          </div>
        ) : (
          <p>❌ No companies found</p>
        )}
        
        <hr />
        <p style={{ fontSize: '12px', color: '#666' }}>
          This is a server-side rendered test page to verify the API is working.<br/>
          Main app: <a href="/">← Back to Reseller Intel</a>
        </p>
      </div>
    );
    
  } catch (error: any) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>🚨 Test Page - Error</h1>
        <p><strong>Error:</strong> {error.message}</p>
        <p><strong>Stack:</strong></p>
        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
          {error.stack}
        </pre>
        <p><a href="/">← Back to Reseller Intel</a></p>
      </div>
    );
  }
}
