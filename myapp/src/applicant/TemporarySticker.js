import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../logo.jpg';
import { FaArrowLeft, FaSave } from 'react-icons/fa';


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

const StickerDonePage = () => {
  const { id } = useParams();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [superusers, setSuperusers] = useState([]);

 
useEffect(() => {
  const fetchSuperusers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://backendvss.pythonanywhere.com/api/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuperusers(response.data);
      console.log('Superusers:', response.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Try refreshing token
        const newToken = await refreshAccessToken();
        if (newToken) {
          try {
            const retryResponse = await axios.get(`https://backendvss.pythonanywhere.com/api/users/`, {
              headers: { Authorization: `Bearer ${newToken}` }
            });

            setSuperusers(retryResponse.data);
          } catch (retryErr) {
            console.error('Retry failed:', retryErr);
            setError('Failed to fetch users after retry.');
          }
        } else {
          setError('Session expired. Please log in again.');
        }
      } else {
        console.error('Error fetching users:', err);
        setError('Users not found or server error.');
      }
    } finally {
      setLoading(false);
    }
  };

  fetchSuperusers();
}, []);

 
useEffect(() => {
  const fetchForm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://backendvss.pythonanywhere.com/api/form-view/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let { data, is_renewal } = response.data;
      data.name = data.name || data.full_name || null;

     setApplicationData({ ...data, is_renewal }); 
    } catch (err) {
      if (err.response && err.response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          try {
            const retryResponse = await axios.get(`https://backendvss.pythonanywhere.com/api/form-view/${id}/`, {
              headers: { Authorization: `Bearer ${newToken}` }
            });

            let retryData = retryResponse.data.data;
            retryData.name = retryData.name || retryData.full_name || null;
          
            setApplicationData(retryData);
          } catch (retryErr) {
            console.error('Retry failed:', retryErr);
            setError('Failed to fetch form after retry.');
          }
        } else {
          setError('Session expired. Please log in again.');
        }
      } else {
        console.error('Error fetching form:', err);
        setError('Form not found or server error.');
      }
    } finally {
      setLoading(false);
    }
  };

  fetchForm();
}, [id]);


const generatePDF = () => {
    const input = document.getElementById('pdfContent');
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [612, 936], // 8.5 x 13 inches
      });
      const pdfWidth = 612;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('application-form.pdf');
    });
};


  if (loading) return (
             <div style={styles.loadingBox}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading... please wait!</p>
      </div>
  );

  if (!applicationData) return <div style={styles.loading}>No data found for this application.</div>;

  return (
    
    
    <div style={styles.pageWrapper}>
             <div style={styles.buttonRow}>
                          <button onClick={() => navigate(-1)} style={styles.backButton}>
              <FaArrowLeft />
        </button>
              <button
          onClick={generatePDF}
          style={{
          
            top: '50%',
            left: '50%',
            padding: '5px',
            backgroundColor: '#ffffff',
            border: '1px solid #065f46',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#065f46',
            gap: '10px',
            fontWeight: 'bold'
          }}
          title="Download as PDF"
        >
          <FaSave size={25} /> Download as PDF
        </button>
 
      </div>
     
     
        <div id="pdfContent" style={styles.pdfContainer}>
        <div style={styles.watermark}>DEBESMSCAT</div>

        <div style={styles.headerBox}>
          <img src={logo} alt="Logo" style={styles.logo} />
          <div style={{ textAlign: 'center' }}>
            <h2 style={styles.headerTitle}>DEBESMSCAT</h2>
            <h4 style={styles.headersubHeader}>PRODUCTION AND COMMERCIALIZATION</h4>
            <p style={styles.headerSubtitle}>Cabitan, Mandaon, Masbate</p>
            <p style={styles.headerSubtitle}>www.debesmscat.edu.ph</p>
            <p style={styles.headerSubtitle}><em>(DEBESMSCAT Vehicle Pass)</em></p>
          </div>
        </div>

        <h3 style={styles.sectionTitle}>Temporary Gate Pass</h3>
        <p style={styles.descriptionText}>
          <em>This temporary gate pass is issued after completing the online vehicle sticker application. It is valid only until the official sticker is claimed.</em>
        </p>

        <div style={styles.pdfFieldBox}>
          <div style={styles.pdfFieldRow}><strong>Application No:</strong> APP - 25 - 00{applicationData.id} </div>
          <div style={styles.pdfFieldRow}><strong>Name:</strong> {applicationData.name}</div>
          <div style={styles.pdfFieldRow}><strong>O.R. No./Date:</strong> {applicationData.or_no}</div>
        </div>
 <div style={styles.signatureSection}>
<div style={styles.signatureBox}>
  <p style={styles.signatureLabel}>Authorized Name</p>

  {/* Filter users who are superusers */}
  {superusers
    .filter(user => user.is_superuser)
    .map(user => (
      <p key={user.id} style={styles.signatureText}>
        {user.first_name} {user.last_name}
      </p>
    ))}

  <div style={styles.signatureLine}></div>
</div>

  <div style={styles.signatureBox}>
    <p style={styles.signatureLabel}>Date Issued</p>
    {/* Text above the signature line */}
    <p style={styles.signatureText}>
  {new Date(applicationData.is_renewal === true ? applicationData.approved_at : applicationData.client2_approved_time).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}
</p>

    <div style={styles.signatureLine}></div>
  </div>
</div>

        <div style={styles.footerBox}>
          <p>Form Code: <strong>FM-SS-03</strong></p>
          <p>Version: <strong>0.1</strong></p>
          <p>Effective: <strong>4/24/2017</strong></p>
        </div>
      </div>

 

    </div>
  );
  
};
const styles = {
  pageWrapper: {
    background: '#f9fafb',
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Times New Roman", Times, serif',
    width: '100%'

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
  pdfContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    width: '8.5in',
    minHeight: '13in',
    padding: '50px',
    border: '1px solid #000',
    boxShadow: '0 0 10px rgba(0,0,0,0.15)',
    boxSizing: 'border-box',
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    fontSize: '60px',
    transform: 'rotate(-30deg)',
    color: 'rgba(0,0,0,0.05)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  backButton: {

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
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    marginBottom: '10px',
  },
  headerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerTitle: {
    margin: '5px 0',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  headersubHeader: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '2px 0',
  },
  headerSubtitle: {
    fontSize: '12px',
    margin: '2px 0',
  },
  sectionTitle: {
    fontSize: '22px',
    color: '#dc2626',
    margin: '10px 0',
    fontWeight: '700',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: '14px',
    color: '#000',
    margin: '10px 0 20px 0',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  pdfFieldBox: {
    width: '100%',
    marginTop: '30px',
    marginBottom: '30px',
    padding: '10px 20px',
    fontSize: '16px',
    lineHeight: '1.8',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  pdfFieldRow: {
    marginBottom: '12px',
  },
  signatureSection: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '50px',
  },
  signatureBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '45%',
  },
  signatureText: {
  fontSize: '14px',
  textAlign: 'center',
  marginBottom: '4px', // space between text and line
},
signatureLine: {
  borderBottom: '1px solid black',
  width: '200px',
  height: '1px',
  margin: '0 auto',
},
  signatureLabel: {
    fontSize: '14px',
    fontStyle: 'italic',
  },
  footerBox: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '40px',
    fontSize: '12px',
    color: '#333',
    width: '100%',
  },
  buttonRow: {
    marginTop: '30px',
    display: 'flex',
    gap: '30px',
    marginBottom: '30px'
  },
  primaryButton: {
    backgroundColor: '#065f46',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    marginTop: '50px',
    fontSize: '18px',
    color: '#333',
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
  

};

const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default StickerDonePage;
