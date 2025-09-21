import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEye, FiX} from 'react-icons/fi';

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [claiming, setClaiming] = useState(false); // changed from boolean to app object
  const [claimingAppForConfirmation, setClaimingAppForConfirmation] = useState(null);
  const [claimApp, setClaimApp] = useState(null); // App being claimed for confirmation




const handleConfirmClaim = async () => {
  if (!claimingAppForConfirmation) return;
  setClaiming(true);
  try {
    const response = await axios.post(
      `https://backendvss.pythonanywhere.com/api/applications/${claimingAppForConfirmation.id}/claim/`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    );

    setApplications((prev) =>
      prev.map((item) =>
        item.id === claimingAppForConfirmation.id
          ? { ...item, is_claimed: response.data.is_claimed }
          : item
      )
    );

    setFilteredApplications((prev) =>
      prev.map((item) =>
        item.id === claimingAppForConfirmation.id
          ? { ...item, is_claimed: response.data.is_claimed }
          : item
      )
    );
  } catch (err) {
    console.error(err);
  } finally {
    setClaiming(false);
    setClaimingAppForConfirmation(null); // close the modal
  }
};





  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://backendvss.pythonanywhere.com/api/all-applications/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
        });
        setApplications(response.data);
        setFilteredApplications(response.data);
        
        console.log(response.data)
        console.log("Fetched apps:", response.data.length, response.data);

      } catch (err) {
        setError('Failed to fetch applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Search
// Search
const handleSearch = (query) => {
  setSearchQuery(query);
  applyFilters(query, dateFilter, typeFilter);
};

// Date filter
const handleDateFilter = (filter) => {
  setDateFilter(filter);
  applyFilters(searchQuery, filter, typeFilter);
};

// Type filter
const handleTypeFilter = (filter) => {
  setTypeFilter(filter);
  applyFilters(searchQuery, dateFilter, filter);
};

const handleStatusFilter = (filter) => {
  setStatusFilter(filter);
  applyFilters(searchQuery, dateFilter, typeFilter, filter);
};


const applyFilters = (search, date, type, status = 'all') => {
  let filtered = [...applications];
  const today = new Date();

  // Search filter
  if (search) {
    const lowerQuery = search.toLowerCase();
    filtered = filtered.filter(
      (app) =>
        (app.name || '').toLowerCase().includes(lowerQuery) ||
        (app.full_name || '').toLowerCase().includes(lowerQuery) ||
        (app.address || '').toLowerCase().includes(lowerQuery)
    );
  }

  // Date filter (same as before)
  switch (date) {
    case 'today':
      filtered = filtered.filter(
        (app) => new Date(app.date).toLocaleDateString() === today.toLocaleDateString()
      );
      break;
    case 'lastWeek':
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      filtered = filtered.filter((app) => new Date(app.date) >= lastWeek);
      break;
    case 'lastMonth':
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      filtered = filtered.filter((app) => new Date(app.date) >= lastMonth);
      break;
    case 'lastYear':
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      filtered = filtered.filter((app) => new Date(app.date) >= lastYear);
      break;
    default:
      break;
  }

  // Status filter first
  if (status !== 'all') {
    filtered = filtered.filter((app) => {
      const appStatus =
        app.status === 'Application Done' || app.status === 'Renewal Done'
          ? 'Completed'
          : app.status === 'Disapproved'
          ? 'Disapproved'
          : ['Checking Renewal', 'Checking Application', 'Waiting Approval'].includes(app.status)
          ? 'Pending'
          : 'Other';

      return status === appStatus;
    });
  }

  // Then Type filter
  if (type !== 'all') {
    filtered = filtered.filter((app) =>
      type === 'renewal' ? app.is_renewal : !app.is_renewal
    );
  }

  setFilteredApplications(filtered);
};

 const handleViewApplication = (app) => {
    // Instead of navigating, open modal
    setSelectedApp(app);
  };

  const closeModal = () => setSelectedApp(null);



   if (loading) return (
             <div style={styles.loadingBox}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading... please wait!</p>
      </div>
  );


  return (
    <div style={{ padding: '70px 50px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', color: '#111827'}}>Application List</h2>


      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Search and Filter */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
  <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        marginRight: '600px'
      
      }}
    >
      <input
        type="text"
        placeholder="Search by Name or Address"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          padding: '8px 12px 8px 36px', // left padding for icon
          fontSize: '14px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          flex: 1,
          boxSizing: 'border-box',
          
        }}
      />
      <FiSearch
        style={{
          position: 'absolute',
          left: 12,
          pointerEvents: 'none',
          color: '#888',
        }}
        size={18}
      />
    </div>
        <select
          value={dateFilter}
          onChange={(e) => handleDateFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="">Filter by Date</option>
          <option value="today">Today</option>
          <option value="lastWeek">Last Week</option>
          <option value="lastMonth">Last Month</option>
          <option value="lastYear">Last Year</option>
        </select>

          <select
    value={typeFilter}
    onChange={(e) => handleTypeFilter(e.target.value)}
    style={{
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid #ccc',
    }}
  >
    <option value="all">All Types</option>
    <option value="application">Applications</option>
    <option value="renewal">Renewals</option>
  </select>
  <select
  value={statusFilter}
  onChange={(e) => handleStatusFilter(e.target.value)}
  style={{
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  }}
>
  <option value="all">All Statuses</option>
  <option value="Pending">Pending</option>
  <option value="Completed">Approved</option>
  <option value="Disapproved">Disapproved</option>
</select>

       
      </div>

      {/* Applications Table */}
<div
  style={{
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  }}
>
  {/* Table Header */}
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '80px 1.5fr 2fr 1fr 1fr 1.5fr 1fr 1fr', // 8 columns
      padding: '12px 15px',
      backgroundColor: '#f3f4f6',
      fontWeight: '600',
      fontSize: '14px',
      color: '#111827',
      borderBottom: '1px solid #e5e7eb',
      alignItems: 'center',
    }}
  >
    <span>Profile</span>
    <span>Name</span>
    <span>Address</span>
    <span>Type</span>
    <span>Status</span>
    <span>Submitted At</span>
    <span>Claimed Sticker</span>
    <span>Action</span>
  </div>

  {/* Table Body */}
  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
    {filteredApplications.length === 0 ? (
      <p style={{ padding: '15px', color: '#9ca3af', textAlign: 'center' }}>No applications found.</p>
    ) : (
      filteredApplications.map((app) => {
        const uniqueKey = `${app.id}-${app.is_renewal ? 'renewal' : 'application'}`;

        return (
          <div
            key={uniqueKey}
            className="application-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1.5fr 2fr 1fr 1fr 1.5fr 1fr 1fr',
              padding: '12px 15px',
              borderBottom: '1px solid #f3f4f6',
              alignItems: 'center',
              fontSize: '14px',
              color: '#374151',
              gap: '5px',
              transition: 'background 0.2s',
            }}
            onClick={() => handleViewApplication(app)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {/* Profile */}
            <img
              src={
                app.picture_id
                  ? `https://backendvss.pythonanywhere.com${app.picture_id}`
                  : app.photos
                  ? `https://backendvss.pythonanywhere.com${app.photos}`
                  : '/default-profile.png'
              }
              alt="Profile"
              style={{
                width: '50px',
                height: '50px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '1px solid #d1d5db',
              }}
              onError={(e) => (e.target.src = '/default-profile.png')}
            />

            {/* Name */}
            <span style={{ fontWeight: '500' }}>{app.name || app.full_name || 'N/A'}</span>

            {/* Address */}
            <span style={{ color: '#6b7280', fontSize: '13px' }}>{app.address || 'N/A'}</span>

            {/* Type */}
            <span
              style={{
                color: app.is_renewal ? '#3b82f6' : '#06b6d4',
                fontWeight: '500',
              }}
            >
              {app.is_renewal ? 'Renewal' : 'Application'}
            </span>

            {/* Status */}
            <span
              style={{
                color:
                  app.status === 'Application Done' || app.status === 'Renewal Done'
                    ? '#16a34a'
                    : app.status === 'Disapproved'
                    ? '#dc2626'
                    : '#f59e0b',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              {app.status === 'Application Done' || app.status === 'Renewal Done'
                ? 'Completed'
                : app.status === 'Disapproved'
                ? 'Disapproved'
                : ['Checking Renewal', 'Checking Application', 'Waiting Approval'].includes(app.status)
                ? 'Pending'
                : 'N/A'}
            </span>

            {/* Submitted At */}
            <span style={{ color: '#6b7280', fontSize: '13px' }}>
              {app.created_at
                ? new Date(app.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'N/A'}
            </span>

            {/* Claimed Button */}
<button
  onClick={(e) => {
    e.stopPropagation();
    setClaimingAppForConfirmation(app);
  }}
  disabled={
    claiming ||
    app.status === 'Disapproved' ||
    (['Application Done', 'Renewal Done'].includes(app.status) && app.is_claimed) ||
    ['Checking Renewal', 'Checking Application', 'Waiting Approval'].includes(app.status)
  }
  style={{
    backgroundColor:
      app.status === 'Disapproved'
        ? '#6b7280' // gray for disapproved
        : ['Checking Renewal', 'Checking Application', 'Waiting Approval'].includes(app.status)
        ? '#6b7280' // gray for pending/waiting
        : app.is_claimed
        ? '#10b981' // green for claimed
        : ['Application Done', 'Renewal Done'].includes(app.status)
        ? '#34d399' // green for set as claimed
        : '#6b7280', // fallback gray
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor:
      app.is_claimed ||
      app.status === 'Disapproved' ||
      ['Checking Renewal', 'Checking Application', 'Waiting Approval'].includes(app.status)
        ? 'not-allowed'
        : 'pointer',
    fontSize: '13px',
  }}
>
  {app.status === 'Disapproved'
    ? 'Not Claimed'
    : ['Checking Renewal', 'Checking Application', 'Waiting Approval'].includes(app.status)
    ? 'Waiting'
    : app.is_claimed
    ? 'Claimed'
    : ['Application Done', 'Renewal Done'].includes(app.status)
    ? 'Set as Claimed'
    : 'Not Claimed'}
</button>




            {/* View Action */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewApplication(app);
              }}
              style={{
                backgroundColor: '#f9fafb',
                color: '#374151',
                border: 'none',
                padding: '6px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiEye /> View
            </button>
          </div>
        );
      })
    )}
  </div>
</div>



{claimingAppForConfirmation && (
  <>
    {/* Overlay */}
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 999,
      }}
      onClick={() => setClaimingAppForConfirmation(null)}
    />

    {/* Modal */}
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff',
        padding: '25px 30px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        textAlign: 'center',
        minWidth: '280px',
        fontFamily: 'Arial, sans-serif',
        color: '#111827',
      }}
    >
      <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>
        Confirm Claim
      </h3>
      <p style={{ marginBottom: '20px', fontSize: '14px', color: '#4b5563', fontWeight: '600' }}>
        Are you sure this application has been claimed sticker?
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          onClick={handleConfirmClaim}
          style={{
            flex: 1,
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            padding: '8px 0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s',
          }}
        >
          Yes
        </button>
        <button
          onClick={() => setClaimingAppForConfirmation(null)}
          style={{
            flex: 1,
            backgroundColor: '#e5e7eb',
            color: '#374151',
            border: 'none',
            padding: '8px 0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s',
          }}
        >
          No
        </button>
      </div>
    </div>
  </>
)}

      {selectedApp && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '40px 30px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              fontFamily: 'Arial, sans-serif',
              color: '#333',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '25px',
                color: '#333',
                padding: 0,
                
              }}
              aria-label="Close modal"
              title="Close"
            >
              <FiX />
            </button>



            {/* Modal Content */}
<div
  style={{
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    padding: '25px 30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '18px',
    color: '#1f2937',
    lineHeight: 1.8,
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: 'auto',
  }}
>
    <p style={{ marginTop: '15px', fontStyle: 'italic', color: '#6b7280', fontSize: '16px' }}>
    Submitted on:{' '}
    <time dateTime={selectedApp.created_at}>
      {selectedApp.created_at
        ? new Date(selectedApp.created_at).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
        : 'N/A'}
    </time>
  </p>
  <img
    src={selectedApp.picture_id ? `https://backendvss.pythonanywhere.com${selectedApp.picture_id}` : '/default-profile.png'}
    alt="Applicant Profile"
    style={{
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '1px solid #333',
      display: 'block',
      margin: '0 auto 20px',
      boxShadow: '0 2px 6px rgba(74, 74, 75, 0.4)',
    }}
    onError={(e) => {
      e.target.src = '/default-profile.png';
    }}
  />
  <p style={{ margin: 0 }}>
    <span style={{ fontWeight: '700', color: '#2563eb', fontSize: '22px' }}>
      {selectedApp.name || selectedApp.full_name || 'N/A'}
    </span>{''}
    , has submitted a <span style={{ fontWeight: '700', color: '#333' }}>
      {selectedApp.is_renewal ? 'renewal application' : 'new application'}
    </span>{' '}
    for <span style={{ fontWeight: '700', color: '#333' }}>
      {selectedApp.is_renewal
  ? 'processing an online approval for vehicle sticker'
  : 'processing an online  approval for vehicle sticker'}

    </span>
    . The application status is currently{' '}
    <span
      style={{
        fontWeight: '700',
        color:
          selectedApp.status === 'Disapproved'
            ? '#dc2626'
            : selectedApp.status === 'Application Done' || selectedApp.status === 'Renewal Done'
            ? '#16a34a'
            : '#f59e0b', // Pending or others
      }}
    >
      {selectedApp.status === 'Application Done' || selectedApp.status === 'Renewal Done'
        ? 'Completed'
        : selectedApp.status === 'Disapproved'
        ? 'Disapproved'
        : ['Checking Renewal', 'Checking Application', 'Waiting Approval'].includes(selectedApp.status)
        ? 'Pending'
        : selectedApp.status || 'N/A'}
    </span>
    .
  </p>

</div>


          </div>
        </div>
      )}
     
    </div>
  );
};

const styles = {
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100%',
  },
  loadingText: {
    fontSize: '16px',
    color: '#555',
    marginTop: '10px',
    fontFamily: 'Arial, sans-serif',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
}
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default ApplicationList;
