import React, { useState } from 'react';

export default function CustomerLogin() {
  const [formData, setFormData] = useState({ phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = () => {
    setOtpSent(true);
    alert('OTP sent to your mobile number');
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Customer Login</h2>
        {!otpSent ? (
          <div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input type="tel" className="form-control" value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <button onClick={sendOtp} className="btn btn-primary" style={{width: '100%'}}>
              Send OTP
            </button>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label>Enter OTP</label>
              <input type="text" className="form-control" value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value})} />
            </div>
            <button className="btn btn-success" style={{width: '100%'}}>
              Verify & Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}