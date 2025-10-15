import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../logo.jpg';
import { FaArrowLeft, FaUserTie, FaUserCheck, FaStamp, FaInfoCircle, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import { refreshAccessToken } from '../utils/tokenUtils';


const StepsPage = () => {
  const navigate = useNavigate();
  const [person1Status, setPerson1Status] = useState('none');
  const [person2Status, setPerson2Status] = useState('none');
  const [stickerDoneStatus, setStickerDoneStatus] = useState('none');
  const [hoveredStep, setHoveredStep] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyApplications, setHistoryApplications] = useState([]); // new


  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');
  
        const response = await axios.get('https://backendvss.pythonanywhere.com/api/application/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(response.data)

        const application = response.data.find(app => app.app_status === "Pending");
        
        const approved = application.is_approved;
        const client2Approved = application.is_client2_approved;
// Use the first or latest application

        if (application.status === "Disapproved") {
          setPerson1Status('disapproved');
          setPerson2Status('none');
          setStickerDoneStatus('none');
        } else if (application.status === 'Checking Application') {
          setPerson1Status(application.is_approved ? 'lightGreen' : 'active');
          setPerson2Status('none');
          setStickerDoneStatus('none');
        } else if (application.status === 'Waiting Approval') {
          setPerson1Status(application.is_approved ? 'lightGreen' : 'done');
          setPerson2Status(application.is_client2_approved ? 'lightGreen' : 'active');
          setStickerDoneStatus('none');
        } else if (application.status === 'Application Done') {
          setPerson1Status(application.is_approved ? 'lightGreen' : 'done');
          setPerson2Status(application.is_client2_approved ? 'lightGreen' : 'done');
          setStickerDoneStatus('done');
        } else {
          setPerson1Status(application.is_approved ? 'lightGreen' : 'active');
          setPerson2Status('none');
          setStickerDoneStatus('none');
        }


     
      } catch (error) {
        if (error.response && error.response.status === 401) {
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
            fetchStatus();

          } 
        } else {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchStatus();
  }, [navigate]);

  // Determine clickability
const isStep1Clickable = person1Status === 'active' || person1Status === 'done' || person1Status === 'lightGreen' || 
  person1Status === 'disapproved';
const isStep2Clickable = person2Status === 'active' || person2Status === 'done' || person2Status === 'lightGreen';
const isStep3Clickable = stickerDoneStatus === 'active' || stickerDoneStatus === 'done' || stickerDoneStatus === 'lightGreen';

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
        <FaArrowLeft />
      </button>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
  <button
    onClick={async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://backendvss.pythonanywhere.com/api/application/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Filter applications that are "Application Done" & "Done"
        const doneApps = response.data.filter(
          (app) => app.status === 'Application Done'
        );

        setHistoryApplications(doneApps);
        setShowHistoryModal(true);
      } catch (error) {
        console.error('Error fetching application history:', error);
      }
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#065f46',
      color: '#ffffff',
      padding: '10px 18px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      marginTop: '-10px',
    }}
  >
    <FaHistory size={16} /> View History
  </button>
</div>

{showHistoryModal && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,

    }}
  >
    <div
      style={{
        backgroundColor: '#ffffff',
        padding: '25px',
        borderRadius: '10px',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        maxHeight: '80vh',
        overflowY: 'auto',
        margin: '0 10px',
        marginRight: '8px',

      }}
    >
      <h3 style={{ marginBottom: '15px', color: '#1f2937' }}>
        <FaExclamationTriangle style={{ marginRight: '10px', color: '#3b82f6' }} />
        Application Done History
      </h3>

      {historyApplications.length > 0 ? (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {historyApplications.map((app) => (
            <li
              key={app.id}
              style={{
                backgroundColor: '#f9fafb',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexWrap: 'wrap', // ✅ allows wrapping on small screens
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '15px',
              }}
            >
              {/* --- Left side: Picture ID --- */}
              <img
                src={
                  app.picture_id?.startsWith('http')
                    ? app.picture_id
                    : `https://${app.picture_id}`
                }
                alt="ID"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '2px solid #d1d5db',
                  flexShrink: 0,
                }}
              />

              {/* --- Right side: Details --- */}
              <div
                style={{
                  flex: '1 1 250px', // ✅ responsive grid behavior
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px 16px',
                  textAlign: 'left',
                }}
              >
                <div>
                  <p style={{ margin: '2px 0' }}>
                    <strong>Name:</strong> {app.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '2px 0' }}>
                    <strong>Vehicle Model:</strong> {app.model_make || 'N/A'}
                  </p>
                </div>
                <div>
             <p style={{ margin: '2px 0' }}>
  <strong>Date Created:</strong>{' '}
  {new Date(app.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}
</p>
                </div>
                <div>
        <p style={{ margin: '2px 0' }}>
  <strong>Last Validation:</strong>{' '}
  {app.client2_approved_time
    ? new Date(app.client2_approved_time).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A'}
</p>
                </div>
              </div>

              {/* --- View Button --- */}
              <div style={{ flexShrink: 0 }}>
                <button
                  onClick={() => navigate(`/form-view/${app.id}`)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#1d4ed8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    width: '100%',
                  }}
                >
                  View
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#1f2937' }}>No completed applications found.</p>
      )}

      <button
        onClick={() => setShowHistoryModal(false)}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#065f46',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          width: '100%',
          maxWidth: '150px',
        }}
      >
        Close
      </button>
    </div>
  </div>
)}



      <img src={logo} alt="Logo" style={styles.logo} />
      <h2 style={styles.header}>DEBESMSCAT</h2>
      <h4 style={styles.subHeader}>PRODUCTION AND COMMERCIALIZATION</h4>
      <p style={styles.subText}>Cabitan, Mandaon, Masbate</p>
      <p style={styles.subText}>www.debesmscat.edu.ph</p>
      <p style={styles.subText}>(DEBESMSCAT Vehicle Pass)</p>
      <h3 style={styles.statusTitle}>Vehicle Pass Status</h3>
      <hr style={styles.hr} />

      <div style={styles.roadmap}>
        {/* Step 1 */}
        <div style={styles.stepBox}>
          <div style={styles.planetWrapper}>
           <div
              style={{
                ...styles.planet,
                backgroundColor:
                  person1Status === 'disapproved'
                    ? '#dc2626'
                    : person1Status === 'lightGreen'
                    ? '#8fd8aaff'
                    : isStep1Clickable
                    ? '#065f46'
                    : '#d1d5db',
              }}
              onClick={isStep1Clickable ? () => navigate('/person1') : undefined}
            >
              <FaUserTie size={40} />
            </div>


            <div style={styles.arrow}></div>
          </div>
          <div style={styles.textWrapper}>
            <p style={styles.stepTitle}>Checker Person</p>
            <p style={styles.stepSubtitle}>Admin 1 checks your application</p>
            <FaInfoCircle
              style={styles.infoIcon}
              onMouseEnter={() => setHoveredStep(1)}
              onMouseLeave={() => setHoveredStep(null)}
            />
            {hoveredStep === 1 && (
              <div style={styles.tooltip}>
                Richard Sales is processing your application.
              </div>
            )}
          </div>
        </div>

        {/* Step 2 */}
        <div style={styles.stepBox}>
          <div style={styles.planetWrapper}>
            <div
              style={{
                ...styles.planet,
               backgroundColor:
                person2Status === 'lightGreen'
                  ? '#8fd8aaff'
                  : isStep2Clickable
                  ? '#065f46'
                  : '#d1d5db',
              }}
              onClick={isStep2Clickable ? () => navigate('/person2') : undefined}
            >
              <FaUserCheck size={40} />
            </div>
            <div style={styles.arrow}></div>
          </div>
          <div style={styles.textWrapper}>
            <p style={styles.stepTitle}>Approval</p>
            <p style={styles.stepSubtitle}>Admin 2 finalizes your approval</p>
            <FaInfoCircle
              style={styles.infoIcon}
              onMouseEnter={() => setHoveredStep(2)}
              onMouseLeave={() => setHoveredStep(null)}
            />
            {hoveredStep === 2 && (
              <div style={styles.tooltip}>
                 Erwin Oliva validating your approved application.
              </div>
            )}
          </div>
        </div>

        {/* Step 3 */}
        <div style={styles.stepBox}>
          <div style={styles.planetWrapper}>
            <div
              style={{
                ...styles.planet,
                backgroundColor:
                  stickerDoneStatus === 'lightGreen'
                    ? '#8fd8aaff'
                    : isStep3Clickable
                    ? '#065f46'
                    : '#d1d5db',

              }}
              onClick={isStep3Clickable ? () => navigate('/sticker-done') : undefined}
            >
              <FaStamp size={40} />
            </div>
          </div>
          <div style={styles.textWrapper}>
            <p style={styles.stepTitle}>Sticker Ready</p>
             <p style={styles.stepSubtitle}>Ready to pay your sticker form</p>
            <FaInfoCircle
              style={styles.infoIcon}
              onMouseEnter={() => setHoveredStep(3)}
              onMouseLeave={() => setHoveredStep(null)}
            />
            {hoveredStep === 3 && (
              <div style={styles.tooltip}>
                Application done, you can generate and print a temporary sticker.
              </div>
            )}
          </div>
        </div>
      </div>

      <p style={styles.footerNotice}>
        Thank you for your patience. Please wait while we process your application.
      </p>
    </div>
  );
};


const styles = {
   hr: {
    margin: '20px 0',
    border: '1px solid #065f46',
    borderTop: '1px solid #e5e7eb', // subtle light gray line
    width: '100%',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
  },
  container: {
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    padding: '40px 20px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
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
    objectFit: 'cover',
    borderRadius: '50%',
    marginBottom: '10px',
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

statusTitle: {
  fontSize: '18px',
  color: '#0f172a',
  margin: '15px 0 30px',
  fontWeight: '600',
},
  title: {
    fontSize: '18px',
    color: '#0f172a',
    marginBottom: '20px',
  },
  roadmap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  stepBox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '350px',
    position: 'relative',
    marginBottom: '30px',
    gap: '10px',
  },
  planetWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  planet: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '24px',
    transition: 'transform 0.3s ease',
    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
  },
  arrow: {
    width: '4px',
    height: '60px',
    backgroundColor: '#065f46',
    borderRadius: '2px',
    marginTop: '0px',
  },
  textWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    position: 'relative',
  },
  infoIcon: {
    color: '#065f46',
    cursor: 'pointer',
    marginTop: '5px',
    fontSize: '18px',
    
  },
  tooltip: {
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fefce8',
    color: '#0f172a',
    padding: '8px',
    borderRadius: '5px',
    fontSize: '14px',
    marginTop: '5px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '200px',
  },
  stepTitle: {
    fontSize: '16px',
    color: '#0f172a',
    fontWeight: 'bold',
    margin: 0,
  },
  stepSubtitle: {
    fontSize: '13px',
    color: '#475569',
    margin: 0,
    marginTop: '4px',
  },
  footerNotice: {
    marginTop: '30px',
    fontSize: '14px',
    color: '#475569',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px 5px',
    background: '#f0fdf4',
    margin: '5px',
  },
};

export default StepsPage;
