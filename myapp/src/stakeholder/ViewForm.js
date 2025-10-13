import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import logo from '../pic/DEBES.png';
import logo_ph from '../pic/logo_ph.png'
import { refreshAccessToken } from '../utils/tokenUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaArrowLeft, FaSave, FaSpinner, FaCheck, FaCut } from 'react-icons/fa';



const ViewFormPage = () => {
    const { id } = useParams();  // Use useParams to get the 'id' param
    const [selectedForm, setSelectedForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); 
    const [photoProxy, setPhotoProxy] = useState(null);
    const [signature1Proxy, setSignature1Proxy] = useState(null);
    const [signature2Proxy, setSignature2Proxy] = useState(null);
    const [status, setStatus] = useState('idle');  // current vehicle photo index

  const formRef = useRef();

   const loadImageWithProxy = async (url) => {
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Proxy image load failed:", error);
      return null;
    }
  };

  // 🔹 Load all 3 images through the proxy
  useEffect(() => {
  const loadAllImages = async () => {
    if (!selectedForm) return; // ⛔ Stop if selectedForm is null

    // Picture (photo)
    if (selectedForm.picture_id) {
      const url = selectedForm.picture_id.startsWith("http")
        ? selectedForm.picture_id
        : `https://backendvss.pythonanywhere.com${selectedForm.picture_id}`;
      const proxy = await loadImageWithProxy(url);
      setPhotoProxy(proxy);
    }

    // Checker’s signature
    if (selectedForm.signature) {
      const url = selectedForm.signature.startsWith("http")
        ? selectedForm.signature
        : `https://backendvss.pythonanywhere.com${selectedForm.signature}`;
      const proxy = await loadImageWithProxy(url);
      setSignature1Proxy(proxy);
    }

    // Approver’s signature
    if (selectedForm.signature2) {
      const url = selectedForm.signature2.startsWith("http")
        ? selectedForm.signature2
        : `https://backendvss.pythonanywhere.com${selectedForm.signature2}`;
      const proxy = await loadImageWithProxy(url);
      setSignature2Proxy(proxy);
    }
  };

  loadAllImages();
}, [selectedForm]);

const handleClick = async () => {
    setStatus('loading');

    // Simulate PDF generation time (replace this with your actual function)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await handleDownloadPDF();

    setStatus('done');

    // Reset back to idle after 2 seconds
    setTimeout(() => setStatus('idle'), 2000);
  };

const handleDownloadPDF = () => {
  const input = formRef.current;

  html2canvas(input, {
    scale: 2,          // High-res rendering
    useCORS: true,     // Allows cross-origin images
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', [215.9, 330.2]); // Long bond paper: 8.5 x 13 in
    const pdfWidth = 215.9;
    const pdfHeight = 330.2;

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    if (heightLeft <= pdfHeight) {
      // Single page
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Optional: Add bold native text (adjust X/Y)
       pdf.setFont('Times', 'bold');
       pdf.setFontSize(16);
       pdf.setTextColor('#FFFFFF');
       pdf.text('.', 10, 20); // Example
    } else {
      // Multi-page logic
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

        if (position === 0) {
          // Optional: Add bold native text on first page
           pdf.setFont('Times', 'bold');
           pdf.setFontSize(16);
           //pdf.text('Bold Native Text', 10, 20);
        }

        heightLeft -= pdfHeight;
        position -= pdfHeight;

        if (heightLeft > 0) {
          pdf.addPage([215.9, 330.2]); // Add long bond page
        }
      }
    }

    pdf.save('vehicle-pass.pdf');
  });
};


const fieldStyle = {
  display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '180px',
  paddingLeft: '8px',
  textAlign: 'center',
  marginLeft: '6px'
};
const adressStyle = {
  display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '120px',
  paddingLeft: '8px',
  marginLeft: '6px'
};

const style = {
  box_header: {
    display: 'flex',
    border: '1px solid #333',
    width: '100%',
    fontFamily: 'Arial',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '120px'

  }
}

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



useEffect(() => {
  const fetchForm = async () => {
    try {
      const newToken = await refreshAccessToken();
      const response = await axios.get(`https://backendvss.pythonanywhere.com/api/form-view/${id}/`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });

      let data = response.data.data;

      // Normalize picture_id
      data.name = data.name || data.full_name || null;
      data.date = data.date || data.created_at|| null;
      data.model_make = data.model_make || data.vehicle_model|| null;
      data.contact = data.contact || data.contact_number|| null;

      setSelectedForm(data);
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
            retryData.date = retryData.date || retryData.created_at || null;
            retryData.makem_model = retryData.make_model || retryData.vehicle_model|| null;
            retryData.contact= retryData.contact || retryData.contact_number || null;
            setSelectedForm(retryData);
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



    const handleImageClick = () => {
  setCurrentPhotoIndex(0); // Reset to the first image
  setIsModalOpen(true);
};


    const handleCloseModal = () => {
        setIsModalOpen(false);
    };



     if (loading) return (
     <div style={styles.loadingBox}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading... please wait!</p>
      </div>
  );
  if (error) return <div>{error}</div>;
   

    return (
      <>
          <div className="no-print" style={{ marginBottom: '20px', display: 'flex', margin: '20px', gap: '50px'}}>
            
      <button
        onClick={() => navigate(-1)}
        style={{
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
        }}
      >
       <FaArrowLeft />
      </button>       
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        style={{
          padding: '7px 12px',
          backgroundColor: status === 'done' ? '#065f46' : '#ffffff',
          border: '1px solid #065f46',
          borderRadius: '5px',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: status === 'done' ? '#fff' : '#065f46',
          gap: '10px',
          fontWeight: 'bold',
          minWidth: '200px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
        }}
        title="Download as PDF"
      >
        <FaSave size={20} />
        {status === 'loading' ? 'Generating PDF...' : status === 'done' ? 'Download Complete' : 'Download as PDF'}

        {/* Right Side Icon */}
        {status === 'loading' && (
          <FaSpinner
            size={18}
            style={{ marginLeft: '8px', animation: 'spin 1s linear infinite' }}
          />
        )}
        {status === 'done' && (
          <FaCheck size={18} style={{ marginLeft: '8px', color: '#fff' }} />
        )}
      </button>

      
    </div>
         <div ref={formRef}
  style={{
    width: '816px',
    height: '1248px',
    margin: '0 auto',
    background: 'white',
    padding: '10px 40px',
    boxSizing: 'border-box',
    fontFamily: 'Times New Roman, serif',
  }}>
        
            <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginRight: '20px',
  width: '100%',
  background: 'white',
}}>       
<div
  className="header-text"
  style={{
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end', // aligns the content to the right
    textAlign: 'right',     // makes text inside align right too
    width: '100%',
    paddingRight: '5px'
  }}
>
  <span>Document Control Number:</span>
  <span>DEBESMSCAT -F-PC-01</span>
</div>

<div className='headerBox' style={style.box_header}>
            <div style={{ width: '130px', height: '120px', borderRight: '1px solid #333', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className='logo'>
  <img src={logo} alt='Logo' style={{ width: '110px', height: '110px', objectFit: 'cover'}} />
</div>
</div>

                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
  <h5 style={{
    margin: '2px',
    fontSize: '12px',
    color: '#434343ff',
    paddingTop: '10px'

  }}>
    Republic of the Philippines
  </h5>

  <h4 style={{
    margin: '2px',
    fontSize: '13px',
    fontWeight: '700'
  }}>
    DR. EMILIO B. ESPINOSA, SR. MEMORIAL STATE COLLEGE 
  </h4>

  <h4 style={{
    margin: '2px',
    fontSize: '13px',
    fontWeight: '700'
  }}>
OF AGRICULTURE AND TECHNOLOGY
  </h4>
    
 <div style={{display: 'flex', justifyContent: 'center'}}>
  <h5 style={{
    margin: '2px',
    fontSize: '11px',
    color: '#434343ff'
    
  }}>
    Cabitan, Mandaon, Masbate
  </h5>

  <h5 style={{
    margin: '2px',
    fontSize: '11px',
    color: 'blue',
    borderBottom: '1px solid blue',
    borderLeft: '1px solid blue',
    paddingLeft: '5px'

  }}>
    www.debesmscat.edu.ph
  </h5>
  
  <div style={{width: '465px', borderBottom: '1px solid #333', display: 'flex', position: 'absolute', marginTop: '20px'}}></div>
<div style={{width: '465px', borderBottom: '1px solid #333', display: 'flex', position: 'absolute', marginTop: '46px', marginLeft: '0px'}}></div>

</div>




  <h3 style={{
    margin: '2px',
    fontSize: '19px',
    fontWeight: '700',
     paddingTop: '5px'
  }}>
FORM
  </h3>

  <h5 style={{
    margin: '0',
    fontSize: '19px',
    fontWeight: '700',

  }}>
    Vehicle Gate Pass Sticker Application
  </h5>
   

</div>
<div style={{ width: '140px', height: '120px', borderLeft: '1px solid #333', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
               <div className='logo_ph'>
  <img src={logo_ph} alt='Logo' style={{ width: '110px', height: '110px', objectFit: 'cover' }} />
</div>
</div>
</div>
 


          <div style={{display: 'flex', width: '100%'}}>
              <div style={{ display: 'grid', gap: '8px', fontSize: '13px', width: '100%', marginTop: '15px', marginLeft:'20px' }}>
  {/* Application No. and Date */}
 
  <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '20px'}}>
    <div>
      <strong>Application No.:</strong>
      <span style={fieldStyle}>2025</span>
    </div>
    <div>
      <strong>Date:</strong>
      <span style={fieldStyle}>
  {new Date(selectedForm.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}
</span>
    </div>
  </div>

  {/* Name and Contact No. */}
  <div style={{ display: 'flex',  justifyContent: 'flex-start', gap: '20px', }}>
    <div>
      <strong>Name:</strong>
      <span style={{  display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '250px',
  paddingLeft: '8px',
  marginLeft: '6px',
  textAlign: 'center'
  }}>{selectedForm.name}</span>
    </div>
    <div>
      <strong>Contact No.:</strong>
      <span style={{  display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '125px',
  paddingLeft: '8px',
   textAlign: 'center',
  marginLeft: '6px'}}>{selectedForm.contact}</span>
    </div>
  </div>

  {/* Address, Birthday, and Age */}
  <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', }}>
    <div>
      <strong>Address:</strong>
      <span style={{ display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '200px',
  paddingLeft: '8px',
   textAlign: 'center',
  marginLeft: '6px'}}>{selectedForm.address}</span>
    </div>
    <div>
      <strong>Birthday:</strong>
      <span style={adressStyle}>
  {selectedForm.birthday
    ? new Date(selectedForm.birthday).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A'}
</span>
    </div>
    <div>
      <strong>Age:</strong>
      <span style={{ display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '20px',
  paddingLeft: '8px',
   textAlign: 'center',
  marginLeft: '6px'}}>{selectedForm.age ?? 'N/A'}</span>
    </div>
  </div>

  {/* Registration and OR/Date */}
  <div style={{ display: 'flex', justifyContent: 'flex-start', minWidth: '500px' }}>
    <div style={{ flex: 1 }}>
      <strong>Vehicle Certificate of Registration No.:</strong>
      <span style={{ display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '250px',
  paddingLeft: '8px',
   textAlign: 'center',
  marginLeft: '6px'}}>{selectedForm.vehicle_register}</span>
    </div>

  </div>
      <div style={{ flex: 1 }}>
      <strong>O.R. No. /Date:</strong>
      <span style={{ display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '350px',
  paddingLeft: '8px',
   textAlign: 'center',
  marginLeft: '6px'}}>{selectedForm.or_no}</span>
    </div>

  {/* Vehicle Type and Plate No. */}
    
<div style={{ display: 'flex', justifyContent: 'flex-start', minWidth: '500px', gap: '10px' }}>
  <strong>Vehicle Type:</strong>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '15px' }}>
    
    <div style={{ display: 'flex', gap: '50px' }}>
      <span>[{selectedForm.vehicle_type === 'motorcycle' ? '✔' : '  '}] <i>Motorcycle</i></span>
      <span>[{selectedForm.vehicle_type === 'tricycle' ? '✔' : '  '}] <i>Tricycle</i></span>
      <span>[{selectedForm.vehicle_type === 'private_suv' ? '✔' : '  '}] <i>Private SUV/AUV/Sedan</i></span>
    </div>

    <div style={{ display: 'flex', gap: '30px' }}>
      <span>[{selectedForm.vehicle_type === 'habal_habal' ? '✔' : '  '}] <i>Habal-habal</i></span>
      <span>[{selectedForm.vehicle_type === 'delivery_truck' ? '✔' : '  '}] <i>Delivery Trucks/Vans</i></span>
      <span>[{selectedForm.vehicle_type === 'pub_puj_puv' ? '✔' : '  '}] <i>PUB/PUJ/PUV</i></span>
    </div>

  </div>
</div>


       {/*<span>{selectedForm.vehicle_type}</span>*/} 
   
 

  {/* Color and Make/Model */}
  <div style={{ display: 'flex',  justifyContent: 'flex-start', minWidth: '500px', gap: '15px'}}>
    <div>
      <strong>Plate No:</strong>
      <span style={{ display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '120px',
  paddingLeft: '8px',
   textAlign: 'center',
  marginLeft: '6px'}}>{selectedForm.plate_number}</span>
    </div>
    <div>
      <strong>Color:</strong>
      <span style={{ display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '100px',
  paddingLeft: '8px',
   textAlign: 'center',
  marginLeft: '6px'}}>{selectedForm.color}</span>
    </div>
    <div>
      <strong>Make/Model:</strong>
      <span style={{ display: 'inline-block',
  borderBottom: '1.5px solid black',
  minWidth: '100px',
  paddingLeft: '8px',
   textAlign: 'center',
  marginLeft: '6px'}}>{selectedForm.model_make}</span>
    </div>
  </div>

  {/* Chassis No. and Engine No. */}
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <div style={{ flex: 1 }}>
      <strong>Chassis No.:</strong>
      <span style={fieldStyle}>{selectedForm.chassis_no}</span>
    </div>
    <div style={{ flex: 1 }}>
      <strong>Engine No.:</strong>
      <span style={fieldStyle}>{selectedForm.engine_no}</span>
    </div>
  </div>



</div>

 <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "10px",
          }}
        >
          {photoProxy ? (
            <img
              src={photoProxy}
              alt="Uploaded Photo"
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "2px",
                border: "1px solid #333",
              }}
            />
          ) : (
            <span>No photo uploaded.</span>
          )}
        </div>

</div>

               
                {/* Note Section */}
<span style={{
  fontFamily: 'Times New Roman, serif',
  fontSize: '15px',
  color: 'black',
  fontWeight: '700',
  marginTop: '5px',
  textAlign: 'left',
  alignSelf: 'flex-start',
  marginLeft: '20px'  // Optional, for flexbox containers
}}><i>Note:</i>

</span>
<span>
<ol style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', color: '#333', width: '640px', fontStyle: 'italic', margin: '2px', marginLeft: '-65px' }}>
  <li>Please print legibly.</li>
  <li style={{ marginTop: '1px' }}>Attach photocopy of Vehicle's Certificate of Registration and Driver's License. </li>
  <span> (Bring the original copy of Vehicle's Certificate of Registration, Driver's License, and this filled-up form for verification.)</span>
  <li style={{ marginTop: '1px' }}>
    If student, please attach a photocopy of student ID/Assessment Form from the Registrar’s Office.
  </li>
  <li style={{ marginTop: '1px' }}>Incomplete documents will not be processed.</li>
  <li style={{ marginTop: '1px' }}>Pay the corresponding fee to the cashier. Ask for Official Receipt.</li>
  <li style={{ marginTop: '1px' }}>
    Sticker will be placed in a noticeable area of the vehicle by authorized DEBESMSCAT personnel only.
  </li>
  <li style={{ marginTop: '1px' }}>
    Falsification and unauthorized use of DEBESMSCAT Vehicle Pass Sticker or this application form will be dealt with accordingly.
  </li>
</ol>
</span>

{/* Certification */}
<span style={{ fontFamily: 'Times New Roman, serif', fontSize: '15px', color: 'black', marginTop: '10px', width: '660px', marginLeft: '-30px' }}>
<span style={{marginLeft: '50px'}} >
  <strong>I CERTIFY</strong> that this information has been accomplished by the undersigned is true and correct 

 </span>
  <span> pursuant to the provision of pertinent laws and regulations.</span>
  </span>


{/* Signature Block */}
<div style={{ width: '100%'}}>
  <div style={{
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    marginRight: '40px',
    justifyContent: 'space-between',
    marginTop: '15px',
    marginLeft: 'auto',  // 👈 This pushes the div to the right
    width: 'fit-content',
     width: '100%'// 👈 Makes sure it doesn't stretch full width
  }}>
  {/* Applicant Section */}
  <div className='checklist_box' style={{marginLeft: '20px'}}>
  <div style={{width: '310px', height: '195x', border: '2px solid #333', padding: '10px', fontSize: '14px', display: 'flex', flexDirection: 'column'}}>
    <span><strong>Checklist:</strong><i style={{fontSize: '11px'}}> (to be filled up by authorized representative)</i></span>
    <div style={{marginTop: '10px'}}></div>
      <span>[ &nbsp;&nbsp;] <i>Certificate of Registration/Official Receipt (LTO)</i></span>
      <span style={{marginTop: '2px'}}>[ &nbsp;&nbsp;] <i>Sales Invoice/Delivery Receipt</i></span>
      <span style={{marginTop: '2px'}}>[ &nbsp;&nbsp;] <i>Driver's License (LTO)</i></span>
      <span style={{marginTop: '2px'}}>[ &nbsp;&nbsp;] <i>Franchise/Mayor's Permit</i></span>
       <span style={{marginTop: '2px'}}>[ &nbsp;&nbsp;] <i>Payment (DEBESMSCAT Cashier)</i></span>
       <span style={{marginLeft: '25px', marginTop: '5px'}}><i>O.R. No.</i> &nbsp;&nbsp;&nbsp;&nbsp;: ________________________</span>
       <span style={{marginLeft: '47px', marginTop: '2px'}}><i>Date</i> &nbsp;&nbsp;&nbsp;&nbsp;: ________________________</span>
        <span style={{marginLeft: '1px', marginTop: '2px'}}><i>Amount Paid</i> &nbsp;&nbsp;&nbsp;&nbsp;: ________________________</span>
      <span style={{marginLeft: '12px', marginTop: '2px'}}><i>Sticker No.</i> &nbsp;&nbsp;&nbsp;&nbsp;: ________________________</span>

  </div>
  </div>

  <div className='signature_box' style={{marginRight: '35px'}}>
  <div style={{ textAlign: 'center' }}>
  <div style={{ borderBottom: '1px solid black', width: '230px', paddingBottom: '1px', marginLeft: '5px', fontSize: '16px' }}>
  <strong>{selectedForm?.name ? selectedForm.name.toUpperCase() : 'N/A'}</strong>
</div>

    <p style={{ fontSize: '14px', marginTop: '2px' }}><i>Applicant's Signature over Printed Name</i></p>
  </div>

  {/* Inspector Section */}
  <div style={{ textAlign: 'center' }}>
    <p style={{ fontSize: '14px',  marginTop: '40px', textAlign: 'left', marginLeft: '-100px'}}>Checked & <br></br><span style={{marginLeft: '20px'}}>Inspected by:</span></p>
    
 {signature1Proxy && (
            <img
              src={signature1Proxy}
              alt="Checker's Signature"
              style={{
                display: "flex",
                position: "absolute",
                width: "100px",
                marginLeft: "70px",
                marginTop: "-40px",
              }}
            />
          )}


    <div style={{ borderBottom: '2px solid black', width: '160px', paddingBottom: '1px', marginLeft: '35px' }}>
      <strong>RICHARD J. SALES</strong>
    </div>
    <p style={{ fontSize: '14px', marginTop: '2px' }}><i>Chief, Security Services</i></p>
  </div>

  {/* Approval Section */}
  <div style={{ textAlign: 'center' }}>
    <p style={{ fontSize: '14px',  marginTop: '20px', textAlign: 'left', marginLeft: '-100px' }}>Approved:</p>
            {signature2Proxy && (
            <img
              src={signature2Proxy}
              alt="Approver's Signature"
              style={{
                display: "flex",
                position: "absolute",
                width: "100px",
                marginLeft: "60px",
                marginTop: "-45px",
              }}
            />
          )}
      <div style={{ borderBottom: '2px solid black', width: '190px', paddingBottom: '1px', marginLeft: '20px' }}>
      <strong>ATTY. ERWIN S. OLIVA</strong>
    </div>
    <p style={{ fontSize: '14px', marginTop: '2px' }}><i>Chief Administrative Officer</i></p>
  </div>
  </div>




</div>
    <div style={{ fontSize: "18px", color: "gray", marginTop: '20px', display: 'flex', justifyContent: 'left', position: 'absolute', marginLeft: '-15px' }}>
      <FaCut />
    </div>
 <div style={{width: '100%', borderBottom: '1px dashed #333', marginTop: '30px', marginBottom: '10px'}} ></div>
  <div style={{display: 'flex', justifyContent: 'flex-start', gap: '130px'}}> 
    <span style={{fontSize: '13px', color: 'green'}}><i>Applicant's Copy</i></span>
      <div style={{display: 'flex', flexDirection: 'column', textAlign: 'center', fontSize: '13px'}}>
        <span style={{fontSize: '14px'}}><strong>DEBESMSCAT Vehicle Pass</strong></span>
        <span><i>(To be filled up by DEBESMSCAT authorized representatives)</i></span>
      </div>
 </div>
 <div style={{display: 'flex', marginTop: '10px', fontSize: '13px', justifyContent: 'space-between'}}>
  <div className='left' style={{display: 'flex', flexDirection: 'column', gap: '5px'}} > 
    <span>Application No.: ____________________________________</span>
    <span>Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ____________________________________ </span>
    <span>Amount Paid&nbsp;&nbsp;&nbsp;&nbsp;: ____________________________________ </span>
    <span>O.R. No./Date&nbsp;&nbsp;: ___________________ / _______________ </span>
     <span>Sticker No.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ____________________________________ </span>


  </div>
  <div className='right' >
   <div style={{width: '320px', height: '60px', border: '2px solid #333', padding: '10px', marginBottom: '10px'}}>
    <span><i>Other Information:</i> </span>

   </div>
   <span style={{margin: '20px 5px', fontSize: '14px'}}> Sticker Issued by:</span>
   <div style={{ borderBottom: '2px solid #333', width: '240px', textAlign: 'center', marginTop: '25px', marginLeft:'60px', fontSize: '15px', marginBottom: '1px '}}>
    <span><strong>ROLLY C. MATRIZ</strong></span>
   </div>
   <span style={{fontSize: '14px', marginLeft: '60px'}}><i>DEBESMSCAT Authorized Representative</i></span>

  </div>
 </div>
 <div className='footers' style={{width: '100%', display: 'flex', justifyContent: 'space-between', fontFamily: 'Arial', fontSize: '13px', marginTop: '20px'}}>
  <span>Effectivity Date: September 1, 2025</span>
  <span>Rev. No.: 01</span>
  <span>Page <span style={{borderBottom: '2px solid #333',  padding: '0 5px'}}> 1 </span> of <span  style={{borderBottom: '2px solid #333', padding: '0 5px'}}> 1 </span></span>
  
 </div>
             </div>
            </div>
      

                {/* Back Button */}
                


 
           
            
            <style>{`
  @media print {
    body {
      -webkit-print-color-adjust: exact;
    }

    @page {
      size: 8.5in 13in;
      margin: 0;
    }

    .no-print {
      display: none !important;
    }
  }
`}</style>


        </div>
      </>
    );
};

export default ViewFormPage;
