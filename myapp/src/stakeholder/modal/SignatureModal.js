import React, { useRef, useEffect, useState } from "react";
import { FaSave, FaSignature } from "react-icons/fa";
import { FaEraser, FaX } from "react-icons/fa6";
import SignaturePad from "react-signature-pad-wrapper";
import axios from "axios";

const SignatureModal = ({ onClose, onSave }) => {
  const sigCanvas = useRef(null);
  const [defaultSignature, setDefaultSignature] = useState(null);

  // Fetch the signature directly inside the modal
  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const token = localStorage.getItem("access");

        const res = await axios.get("https://backendvss.pythonanywhere.com/api/current-user/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const signature = res.data.profile?.signature;
        if (signature) {
          const fullURL = `https://backendvss.pythonanywhere.com${signature}`;
          setDefaultSignature(fullURL);
        }
      } catch (err) {
        console.error("Error fetching signature:", err);
      }
    };

    fetchSignature();
  }, []);

  // Load signature onto canvas when available
  useEffect(() => {
    if (sigCanvas.current && defaultSignature) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = defaultSignature;

      img.onload = () => {
        const canvas = sigCanvas.current._sigPad._canvas;
        const ctx = canvas.getContext("2d");
        sigCanvas.current.clear();
        ctx.drawImage(img, 0, 0);
      };
    }
  }, [defaultSignature]);

  const handleSave = () => {
    if (sigCanvas.current) {
      const dataURL = sigCanvas.current.toDataURL("image/png");
      onSave(dataURL);
      onClose();
    }
  };

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "570px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#065f46" }}>
          <FaSignature size={30} /> E-Signature
        </h2>

        <SignaturePad
          ref={sigCanvas}
          options={{
            minWidth: 2,
            maxWidth: 4,
            penColor: "black",
          }}
          canvasProps={{
            width: 470,
            height: 270,
            className: "signature-canvas",
            style: {
              border: "2px dashed #aaa",
              borderRadius: "8px",
              marginBottom: "16px",
              backgroundColor: "#fefefe",
            },
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
              color: "#065f46",
              cursor: "pointer",
              border: "1px solid #065f46",
              fontWeight: "bold",
            }}
          >
            <FaEraser /> Clear
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#065f46",
              cursor: "pointer",
              border: "1px solid #065f46",
              fontWeight: "bold",
            }}
          >
            <FaX /> Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#065f46",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            <FaSave /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
