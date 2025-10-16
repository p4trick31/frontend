import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../logo.jpg';
import { FaArrowLeft, FaUserCircle, FaCheckCircle, FaHourglassHalf, FaInfoCircle } from 'react-icons/fa';


// Token refresh function (same as Person1Page)
async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refresh');
    if (!refreshToken) return null;

    const response = await axios.post('https://backendvss.pythonanywhere.com/api/token/refresh/', {
      refresh: refreshToken,
    });

    localStorage.setItem('token', response.data.access);
    return response.data.access;
  } catch (error) {
    console.error("Failed to refresh token", error);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('isAuthenticated');
    return null;
  }
}

const Person2Page = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvalStatus, setApprovalStatus] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const fetchApplicationData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('https://backendvss.pythonanywhere.com/api/application/get_submitted', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      console.log("API response:", response.data);

          const pendingApplications = response.data.filter(
      (app) => app.app_status === "Pending"
    );


      setApplications(pendingApplications);
      
      const statusMap = {};
      const statusPromises = response.data.map(async (app) => {
        try {
          const statusResponse = await axios.get(`https://backendvss.pythonanywhere.com/api/application/get_submitted/${app.id}/client2_approve/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          statusMap[app.id] = statusResponse.data.is_client2_approved;
        } catch (error) {
          console.error(`Error fetching approval status for application ID ${app.id}:`, error.message);
          statusMap[app.id] = false;
        }
      });
      await Promise.all(statusPromises);
      setApprovalStatus(statusMap);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          await fetchApplicationData(); // Retry after refreshing
        }
      } else {
        console.error('Error fetching application data:', error.message);
        setError('Failed to fetch applications.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationData();
  }, []);

  const handleViewForm = (application) => {
    navigate(`/form-view/${application.id}`);
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/steps')} style={styles.backButton}>
        <FaArrowLeft />
      </button>

      <img src={logo} alt="Logo" style={styles.logo} />
      <h2 style={styles.header}>DEBESMSCAT</h2>
      <h4 style={styles.subHeader}>PRODUCTION AND AUXILIARY SERVICES</h4>
      <p style={styles.subText}>Cabitan, Mandaon, Masbate</p>
      <p style={styles.subText}>www.debesmscat.edu.ph</p>
      <p style={styles.subText}>(DEBESMSCAT Vehicle Pass)</p>
      <h3 style={styles.title}>Approving Your Application</h3>

      <hr style={styles.hr} />

      
      <div className="appBox" style={styles.appBox}>
  {loading ? (
    <div style={styles.loadingBox}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading application data...</p>
    </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : applications.length > 0 ? (
          applications.map(application => (
            <div key={application.id} style={styles.card}>
              <img 
                src={`https://backendvss.pythonanywhere.com${application.picture_id}`} 
                alt="Application ID" 
                style={{
                  width: '100px',        // adjust as needed
                  height: '100px',       // adjust as needed
                  objectFit: 'cover',    // crop to fill box nicely
                  borderRadius: '50%',   // rounded corners
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', // soft shadow
                  margin: '10px',       // spacing around
                }} 
                />

              <h2 style={styles.applicantName}>Name: {application.name}</h2>
              <h4 style={styles.info}><i>Purpose: </i>{application.position} for processing vehicle sticker</h4>
              
              <p style={styles.info}>
                <strong><i>Date & Time Submitted:</i></strong>{' '}
                {new Date(application.person2_received_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
              <p style={styles.info}><strong><i>Status:</i></strong> {application.status}</p>

              <p style={styles.message}>
                {approvalStatus[application.id] ? (
                  <p style={styles.messageApproved}>
                      <FaCheckCircle style={{ color: '#16a34a', marginRight: '8px', verticalAlign: 'middle' }} />
                    Hi <strong>{application.name}</strong>, your application has been approved by Mr. Erwin S. Oliva!
                  </p>
                ) : (
                  <p style={styles.messageChecking}>
                     <FaHourglassHalf style={{ color: '#f59e0b', marginRight: '8px', verticalAlign: 'middle' }} />
                    Hi <strong>{application.name}</strong>, your request form has been generated submit to Mr. Erwin S. Oliva. Please wait for approval within several hours.
                  </p>
                )}
              </p>


                 

              {application.is_client2_approved && (
                <div style={styles.approvalInfo}>
                    <p style={styles.infoDetail}><strong>Validated by:</strong> Mr. Erwin S. Oliva (Approving Officer)</p>
                    <p style={styles.infoDetail}>
                      <strong>Date & Time Approved:</strong>{' '}
                       {new Date(application.client2_approved_time).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    <p style={styles.thankYou}>Thank you for your patience. You may now ready to claim your temporary sticker and print form.</p>
                </div>
                )}


            

             
            </div>
          ))
        ) : (
          <p>No applications found.</p>
        )}

       <div
             style={{
               position: 'absolute',
               top: '20px',
               right: '20px',
               backgroundColor: '#ffffff',
               border: '1px solid #e5e7eb',
               borderRadius: '8px',
               padding: '8px',
               width: '100px',
               maxWidth: '70%',
               textAlign: 'center',
               cursor: 'pointer',
               boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
               transition: 'all 0.3s ease',
             }}
             onMouseEnter={() => setIsHovered(true)}
             onMouseLeave={() => setIsHovered(false)}
           >
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <FaInfoCircle style={{ color: '#065f46', marginRight: '6px' }} />
               <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '14px' }}>Approver Info</span>
             </div>
       
             {isHovered && (
               <div
                 style={{
                   marginTop: '10px',
                   borderTop: '1px solid #e5e7eb',
                   paddingTop: '10px',
                   opacity: isHovered ? 1 : 0,
                   transition: 'opacity 0.3s ease-in-out',
                 }}
               >
                 <FaUserCircle size={50} color="#065f46" />
                 <p style={{ margin: '6px 0 0', fontWeight: 'bold' }}>Atty. Erwin S. Oliva</p>
                 <p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>Chief Administrative Officer</p>
               </div>
             )}
           </div>
      </div>
    </div>
  );
};

const styles = {
  hr: {
    margin: '20px 0',
    border: '1px solid #065f46',
    borderTop: '1px solid #e5e7eb',
    width: '100%',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
  },
  userBox: {
    minWidth: '150px',
    textAlign: 'center',
    color: '#065f46',
    fontFamily: 'Arial, sans-serif',
    marginLeft: '20px',
    flexShrink: 0,
  },
  userName: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  userPosition: {
    margin: '0',
    fontSize: '12px',
    color: '#475569',
  },
  container: {
    backgroundColor: '#fff',
    minHeight: '100vh',
    padding: '30px 20px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    backgroundColor: '#065f46',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '18px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
  },
  logo: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    marginBottom: '5px',
  },
  header: {
    fontSize: '22px',
    color: '#065f46',
    margin: '5px 0',
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: '16px',
    color: '#065f46',
    fontWeight: 'bold',
    margin: '2px 0',
    letterSpacing: '0.5px',
  },
  subText: {
    fontSize: '17px',
    color: '#475569',
    margin: '5px 0',
  },
  title: {
    fontSize: '18px',
    color: '#0f172a',
    margin: '20px 0',
  },
  appBox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  
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
   card: {
    backgroundColor: 'rgba(250, 255, 250, 1)',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    padding: '10px',
    marginBottom: '20px',
    textAlign: 'left',
    borderLeft: '2px solid #065f46',
     borderBottom: '2px solid #065f46'
  },
  applicantName: {
    color: '#333',
    marginBottom: '8px',
    borderBottom: '2px solid #636262ff',
    padding: '2px',

  },
  info: {
    margin: '7px 0',
    color: '#545556ff',
    fontSize: '15px',
    marginTop: '10px'
  },
  approvalInfo: {
  backgroundColor: '#f0fdf4',
  border: '1px solid #34d399',
  padding: '10px',
  borderRadius: '5px',
  marginTop: '10px',
},
infoDetail: {
  fontSize: '13px',
  margin: '4px 0',
  color: '#065f46',
},
thankYou: {
  fontSize: '13px',
  marginTop: '8px',
  color: '#0f172a',
  fontWeight: 'bold',
},
  messageChecking: {
  borderLeft: '1px solid #92400e ',
  margin: '12px 0',
  fontSize: '17px',
  color: '#92400e', // dark yellow text
  backgroundColor: '#faf8e2ff', // light yellow background
  padding: '10px',
  borderRadius: '5px',
},


messageApproved: {
  margin: '12px 0',
  fontSize: '17px',
  color: '#065f46', // dark green text
  backgroundColor: '#d1fae5', // light green background
  padding: '10px',
  borderRadius: '5px',
    borderLeft: '1px solid #065f46'
},
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default Person2Page;
