import React, { useState } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import '../../styles/adminDashboard.css';

const APKManagement = () => {
  // Current active APK info
  const [activeApk, setActiveApk] = useState({
    version: '1.0',
    buildDate: '2026-05-28',
    fileSize: '70.5 MB',
    totalDownloads: 512,
    minAndroid: 'Android 8.0 (Oreo)',
    targetAndroid: 'Android 14 (API 34)',
    filename: 'RoadRescue.apk',
    releaseNotes: 'Production v1.0 release compiling the fully repaired and audited emergency contact persistence system, instant state synchronization, duplicate and size validations, and strict owner-only security constraints.'
  });

  // Mock Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newVersion, setNewVersion] = useState('');
  const [newReleaseNotes, setNewReleaseNotes] = useState('');
  const [newMinAndroid, setNewMinAndroid] = useState('Android 8.0');
  const [selectedFile, setSelectedFile] = useState(null);

  // Version history mock data
  const [versionHistory, setVersionHistory] = useState([
    { version: '1.0', buildDate: '2026-05-28', fileSize: '70.5 MB', downloads: 27, status: 'active', notes: 'Production v1.0 release compiling the fully repaired and audited emergency contact persistence system, instant state synchronization, duplicate and size validations, and strict owner-only security constraints.' },
    { version: '0.9.8', buildDate: '2026-05-27', fileSize: '70.2 MB', downloads: 485, status: 'deprecated', notes: 'Stable release incorporating optimized profile screens, real-time map GPS tracking, and instant SOS alerts.' },
    { version: '0.9.5', buildDate: '2026-05-20', fileSize: '68.8 MB', downloads: 142, status: 'deprecated', notes: 'Initial beta trial featuring customer and mechanic workflows, integrated chat maps.' }
  ]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile || !newVersion) {
      alert('Please select an APK file and specify a version number.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Add new mock version to history
            const addedVersion = {
              version: newVersion,
              buildDate: new Date().toISOString().split('T')[0],
              fileSize: `${Math.round((selectedFile.size / (1024 * 1024)) * 10) / 10} MB`,
              downloads: 0,
              status: 'active',
              notes: newReleaseNotes || 'Internal test build.'
            };

            // Set old active to deprecated
            const updatedHistory = versionHistory.map(v => v.status === 'active' ? { ...v, status: 'deprecated' } : v);
            setVersionHistory([addedVersion, ...updatedHistory]);
            
            // Set new active
            setActiveApk({
              ...activeApk,
              version: newVersion,
              buildDate: addedVersion.buildDate,
              fileSize: addedVersion.fileSize,
              filename: selectedFile.name,
              releaseNotes: addedVersion.notes
            });

            setUploading(false);
            setSelectedFile(null);
            setNewVersion('');
            setNewReleaseNotes('');
            alert('New APK version has been successfully simulated and published!');
          }, 500);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  return (
    <div className="admin-theme min-vh-100 pb-5" style={{ backgroundColor: '#0F1419' }}>
      <AdminNav />

      <div className="container-fluid px-4 py-4">
        
        {/* Header */}
        <div className="mb-4">
          <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
            Release Operations
          </span>
          <h2 className="fw-black font-outfit text-white mb-0 admin-title-gradient">Android APK Distribution</h2>
        </div>

        {/* Top metrics grids */}
        <div className="row g-4 mb-4">
          
          {/* Card 1: Active Production Version */}
          <div className="col-12 col-md-7">
            <div className="admin-glass-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                <div>
                  <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 admin-badge mb-1">Production Active</span>
                  <h4 className="fw-bold text-white mb-0">Build Version: {activeApk.version}</h4>
                </div>
                <div className="text-end">
                  <span className="small text-muted d-block">Build Date: {activeApk.buildDate}</span>
                  <span className="small text-muted d-block">Size: {activeApk.fileSize}</span>
                </div>
              </div>

              <div className="row g-3 mt-3 py-3 border-top border-bottom border-secondary border-opacity-10 small text-white-50">
                <div className="col-6 col-sm-4">
                  <span className="text-muted d-block">Min Supported</span>
                  <strong className="text-light">{activeApk.minAndroid}</strong>
                </div>
                <div className="col-6 col-sm-4">
                  <span className="text-muted d-block">Target SDK</span>
                  <strong className="text-light">{activeApk.targetAndroid}</strong>
                </div>
                <div className="col-12 col-sm-4">
                  <span className="text-muted d-block">Release Downloads</span>
                  <strong className="text-warning fs-6"><i className="fas fa-circle-down me-1.5"></i> {activeApk.totalDownloads} downloads</strong>
                </div>
              </div>

              <div className="mt-3 text-white-50 small">
                <span className="fw-bold text-white d-block mb-1">Active Release Notes</span>
                <p className="mb-0 italic">"{activeApk.releaseNotes}"</p>
              </div>
            </div>
          </div>

          {/* Card 2: Upload Placeholder Form */}
          <div className="col-12 col-md-5">
            <div className="admin-glass-card p-4 h-100">
              <h5 className="fw-bold font-outfit text-white mb-3">Distribute New Build</h5>
              
              <form onSubmit={handleUploadSubmit}>
                <div className="mb-3">
                  <label className="form-label text-white-50 small mb-1">Select APK File</label>
                  <input 
                    type="file" 
                    className="form-control admin-input border-0" 
                    accept=".apk"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {selectedFile && <span className="small text-success mt-1 d-block font-mono" style={{ fontSize: '11px' }}>Selected: {selectedFile.name}</span>}
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label text-white-50 small mb-1">Version Number</label>
                    <input 
                      type="text" 
                      className="form-control admin-input border-0" 
                      placeholder="e.g. 1.0.1"
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      disabled={uploading}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-white-50 small mb-1">Min Android</label>
                    <select 
                      className="form-select admin-input border-0"
                      value={newMinAndroid}
                      onChange={(e) => setNewMinAndroid(e.target.value)}
                      disabled={uploading}
                    >
                      <option value="Android 8.0">Android 8.0</option>
                      <option value="Android 9.0">Android 9.0</option>
                      <option value="Android 10.0">Android 10.0</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50 small mb-1">Release Comments</label>
                  <textarea 
                    className="form-control admin-input border-0" 
                    rows="2"
                    placeholder="Brief changelogs..."
                    value={newReleaseNotes}
                    onChange={(e) => setNewReleaseNotes(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn admin-btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Uploading build {uploadProgress}%...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-arrow-up"></i>
                      <span>Upload & Release APK</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Download analytics section */}
        <div className="row g-4 mb-4">
          
          {/* Card 4: Device Models mock analytics */}
          <div className="col-12 col-md-6">
            <div className="admin-glass-card p-4">
              <h5 className="fw-bold font-outfit text-white mb-3">Install Distribution (by Device Brand)</h5>
              
              <div className="d-flex flex-column gap-3 py-2 small text-white-50">
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Samsung Electronics (Galaxy)</span>
                    <strong>45%</strong>
                  </div>
                  <div className="progress bg-dark" style={{ height: '6px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Xiaomi / Redmi / POCO</span>
                    <strong>28%</strong>
                  </div>
                  <div className="progress bg-dark" style={{ height: '6px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '28%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>OnePlus / Oppo / Vivo</span>
                    <strong>17%</strong>
                  </div>
                  <div className="progress bg-dark" style={{ height: '6px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '17%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Google Pixel</span>
                    <strong>10%</strong>
                  </div>
                  <div className="progress bg-dark" style={{ height: '6px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Android Versions mock analytics */}
          <div className="col-12 col-md-6">
            <div className="admin-glass-card p-4">
              <h5 className="fw-bold font-outfit text-white mb-3">Install Distribution (by Android SDK)</h5>
              
              <div className="d-flex flex-column gap-3 py-2 small text-white-50">
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Android 13 / 14 (API 33 / 34)</span>
                    <strong>62%</strong>
                  </div>
                  <div className="progress bg-dark" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: '62%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Android 11 / 12 (API 30 / 31)</span>
                    <strong>25%</strong>
                  </div>
                  <div className="progress bg-dark" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: '25%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Android 9 / 10 (API 28 / 29)</span>
                    <strong>11%</strong>
                  </div>
                  <div className="progress bg-dark" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: '11%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Android 8 (API 26 / 27)</span>
                    <strong>2%</strong>
                  </div>
                  <div className="progress bg-dark" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: '2%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Card 5: Version History Table */}
        <div className="row g-4">
          <div className="col-12">
            <div className="admin-glass-card">
              <h5 className="fw-bold font-outfit text-white mb-3">Release Version History</h5>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Build Version</th>
                      <th>Build Date</th>
                      <th>File Size</th>
                      <th>Total Downloads</th>
                      <th>Changelog Notes</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versionHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="fw-bold text-white">v{item.version}</td>
                        <td className="text-white-50">{item.buildDate}</td>
                        <td className="text-white-50">{item.fileSize}</td>
                        <td className="text-white-50"><i className="fas fa-circle-down me-1.5 text-warning"></i> {item.downloads} downloads</td>
                        <td className="text-white-50" style={{ maxWidth: '300px' }}>{item.notes}</td>
                        <td>
                          {item.status === 'active' ? (
                            <span className="admin-badge admin-badge-success">Active Production</span>
                          ) : (
                            <span className="admin-badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#A8A8A8', border: '1px solid rgba(255,255,255,0.1)' }}>Archived</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default APKManagement;
