import React from 'react';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AdminErrorBoundary] Caught uncaught panel rendering exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="admin-theme p-4 m-3 rounded-3 border border-danger border-opacity-20 bg-dark"
          style={{ 
            backgroundColor: 'rgba(26, 31, 46, 0.4)', 
            backdropFilter: 'blur(8px)',
            maxWidth: '650px',
            margin: '40px auto'
          }}
        >
          <div className="text-center py-4">
            <i className="fas fa-triangle-exclamation text-danger fs-1 mb-3"></i>
            <h5 className="fw-bold font-outfit text-white mb-2">Administrative Component Crash</h5>
            <p className="text-white-50 small mb-4 px-3" style={{ fontSize: '13px' }}>
              The management console has intercepted a rendering exception in this panel. Existing systems and background data collections remain unaffected.
            </p>
            
            {this.state.error && (
              <div 
                className="bg-black bg-opacity-40 p-3 rounded text-start mb-4 text-warning font-monospace overflow-auto" 
                style={{ fontSize: '11px', maxHeight: '150px', whiteSpace: 'pre-wrap' }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div className="d-flex justify-content-center gap-3">
              <button 
                type="button" 
                className="btn admin-btn-secondary px-4 py-2 small"
                onClick={() => window.history.back()}
              >
                <i className="fas fa-arrow-left me-1.5"></i> Go Back
              </button>
              <button 
                type="button" 
                className="btn admin-btn-primary px-4 py-2 small"
                onClick={this.handleReset}
              >
                <i className="fas fa-arrows-rotate me-1.5"></i> Reload Console
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
