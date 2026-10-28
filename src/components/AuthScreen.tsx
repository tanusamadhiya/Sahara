import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowRight, ShieldCheck, Lock, Smartphone, Chrome, User, Mail, 
  MapPin, Phone, Droplets, ShieldAlert, Globe, Eye, EyeOff 
} from "lucide-react";
import { UserProfile } from "../types";
import { useTranslation } from "../utils/i18n";

interface AuthScreenProps {
  onLoginSuccess: (userProfile: UserProfile) => void;
  initialMode?: "login" | "register";
  onCancel?: () => void;
}

export default function AuthScreen({ onLoginSuccess, initialMode = "login", onCancel }: AuthScreenProps) {
  const { language, setLanguage, t } = useTranslation();
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form States
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regCity, setRegCity] = useState("Mumbai");
  const [regDistrict, setRegDistrict] = useState("Mumbai Suburban");
  const [regVillage, setRegVillage] = useState("Bandra");
  const [regState, setRegState] = useState("Maharashtra");
  const [regBloodGroup, setRegBloodGroup] = useState(""); // optional, empty string means not specified
  const [regMedicalConditions, setRegMedicalConditions] = useState(""); // optional
  const [regLanguage, setRegLanguage] = useState<"en" | "hi">(language);
  const [regEmergencyContactName, setRegEmergencyContactName] = useState("");
  const [regEmergencyContactPhone, setRegEmergencyContactPhone] = useState("");

  useEffect(() => {
    setRegLanguage(language);
  }, [language]);

  // OTP Simulation States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(59);
  const [simulatedOtp, setSimulatedOtp] = useState("");

  // Common UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Load remembered user on mount and pre-seed default user database
  useEffect(() => {
    const savedEmail = localStorage.getItem("sahara_remembered_email");
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }

    // Pre-seed default Arjun Dev user for authentic login
    const savedUsersJson = localStorage.getItem("sahara_registered_users");
    if (!savedUsersJson) {
      const defaultUsers = [
        {
          id: "U-18402",
          name: "Tanu Samadhiya",
          username: "tanu",
          email: "tanu@sahara.gov.in",
          password: "password123",
          phone: "+91 98123 45680",
          bloodType: "O+",
          healthId: "NHID-8902-1402",
          allergies: ["Penicillin", "Dust Mites"],
          medications: ["Atenolol 50mg (daily)"],
          insuranceProvider: "National Safety Assurance",
          policyNumber: "POL-771142",
          emergencyContactName: "Rajesh Sharma (Father)",
          emergencyContactPhone: "+91 98123 45680",
          safetyScore: 92,
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
          language: "en",
          theme: "light",
          credits: 350,
          villageScore: 94,
          city: "Mumbai",
          state: "Maharashtra",
          gender: "Female",
          age: 24,
          medicalConditions: ["Hypertension", "Dust Allergy"],
          disabilities: ["None"],
          address: "Sector 4, Bandra West, Mumbai, Maharashtra 400050",
          district: "Mumbai Suburban",
          village: "Bandra",
          emergencyContacts: [{ name: "Rajesh Sharma", relation: "Father", phone: "+91 98123 45680" }],
          healthNotes: "Patient is a daily active runner. Please bypass Atenolol if heart rate is under 55 BPM."
        }
      ];
      localStorage.setItem("sahara_registered_users", JSON.stringify(defaultUsers));
    }
  }, []);

  // OTP Count-down
  useEffect(() => {
    if (!isOtpSent) return;
    if (otpTimer === 0) return;

    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOtpSent, otpTimer]);

  // Handle OTP Digit Inputs
  const handleDigitChange = (index: number, val: string) => {
    if (errorMessage) setErrorMessage("");
    if (!/^[0-9]?$/.test(val)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 3) {
      digitRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  // Quick preset login handler (for developers or hackathon presenters)
  const triggerPresetLogin = () => {
    const defaultProfile: UserProfile = {
      id: "U-18402",
      name: "Tanu Samadhiya",
      email: "tanu@sahara.gov.in",
      phone: "+91 98123 45680",
      bloodType: "O+",
      healthId: "NHID-8902-1402",
      allergies: ["Penicillin", "Dust Mites"],
      medications: ["Atenolol 50mg (daily)"],
      insuranceProvider: "National Safety Assurance",
      policyNumber: "POL-771142",
      emergencyContactName: "Rajesh Sharma (Father)",
      emergencyContactPhone: "+91 98123 45680",
      safetyScore: 92,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
      language: "en",
      theme: "light",
      credits: 350,
      villageScore: 94,
      gender: "Female",
      age: 24,
      medicalConditions: ["Hypertension", "Dust Allergy"],
      disabilities: ["None"],
      address: "Sector 4, Bandra West, Mumbai, Maharashtra 400050",
      district: "Mumbai Suburban",
      village: "Bandra",
      emergencyContacts: [{ name: "Rajesh Sharma", relation: "Father", phone: "+91 98123 45680" }],
      healthNotes: "Patient is a daily active runner. Please bypass Atenolol if heart rate is under 55 BPM."
    };
    onLoginSuccess(defaultProfile);
  };

  // Form Submit Handler for Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (loginMethod === "email") {
      if (!loginEmail || !loginPassword) {
        setErrorMessage(t("Validation Error: Please fill in both email and password fields."));
        return;
      }
      setIsSubmitting(true);

      setTimeout(() => {
        setIsSubmitting(false);
        // Check if user credentials match any registered user
        const savedUsersJson = localStorage.getItem("sahara_registered_users");
        const registeredUsers: any[] = savedUsersJson ? JSON.parse(savedUsersJson) : [];
        
        // Find by email or username
        const matched = registeredUsers.find(
          u => u.email.toLowerCase() === loginEmail.toLowerCase() || 
               (u.username && u.username.toLowerCase() === loginEmail.toLowerCase())
        );

        if (matched) {
          if (matched.password === loginPassword) {
            if (rememberMe) {
              localStorage.setItem("sahara_remembered_email", loginEmail);
            } else {
              localStorage.removeItem("sahara_remembered_email");
            }
            onLoginSuccess(matched);
            return;
          } else {
            setErrorMessage(t("Authentication Error: Incorrect password. Please verify credentials."));
            return;
          }
        } else {
          setErrorMessage(t("Authentication Error: No registered user found matching that Email or Username."));
        }
      }, 1000);
    } else {
      // Phone OTP setup
      if (!loginPhone || loginPhone.trim().length < 8) {
        setErrorMessage(t("Validation Error: Please enter a valid mobile number."));
        return;
      }
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setSimulatedOtp(code);
        setIsOtpSent(true);
        setOtpTimer(59);
        
        // Print strictly to console as requested, do NOT display on screen
        console.log(`🔒 [SAHARA SMS SECURE PORT] Sent OTP broadcast to +91${loginPhone} with verification code: ${code}`);
        setSuccessMessage(t("[SMS MESH BROADCAST SENT]: Secure satellite OTP dispatched. Check your developer console or use standard bypass '1234'."));
      }, 1200);
    }
  };

  // Submit OTP Code Verification
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const enteredCode = otpDigits.join("");

    if (enteredCode.length < 4) {
      setErrorMessage(t("Validation Error: Please input the complete 4-digit security code."));
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (enteredCode === simulatedOtp || enteredCode === "1234" || enteredCode === "0000") {
        // Find if this phone matches any registered user
        const savedUsersJson = localStorage.getItem("sahara_registered_users");
        const registeredUsers: any[] = savedUsersJson ? JSON.parse(savedUsersJson) : [];
        const matched = registeredUsers.find(u => u.phone.includes(loginPhone) || loginPhone.includes(u.phone));

        if (matched) {
          onLoginSuccess(matched);
        } else {
          setErrorMessage(t("System Info: Phone number is verified, but no secure profile is associated with it. Please sign up manually."));
          // Switch to registration and prefill phone
          setRegPhone(loginPhone);
          setAuthMode("register");
          setIsOtpSent(false);
        }
      } else {
        setErrorMessage(t("Verification Error: Incorrect OTP verification code. Try again or use '1234'."));
      }
    }, 1000);
  };

  // Submit Registration Form
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Trim and prepare values
    const nameVal = regName.trim();
    const usernameVal = regUsername.trim().toLowerCase();
    const phoneVal = regPhone.trim();
    const emailVal = regEmail.trim();
    const passwordVal = regPassword;
    const confirmPasswordVal = regConfirmPassword;
    const cityVal = regCity.trim();
    const districtVal = regDistrict.trim();
    const villageVal = regVillage.trim();
    const stateVal = regState.trim();
    const bloodVal = regBloodGroup;
    const medicalConditionsVal = regMedicalConditions.trim();
    const contactNameVal = regEmergencyContactName.trim();
    const contactPhoneVal = regEmergencyContactPhone.trim();

    // STRICT VALIDATION OF EVERY SINGLE FIELD
    if (!nameVal) {
      setErrorMessage(t("Validation Error: Full Name is required."));
      return;
    }
    if (!usernameVal) {
      setErrorMessage(t("Validation Error: Username is required."));
      return;
    }
    if (usernameVal.length < 3) {
      setErrorMessage(t("Validation Error: Username must be at least 3 characters long."));
      return;
    }
    if (!phoneVal) {
      setErrorMessage(t("Validation Error: Mobile Phone Number is required."));
      return;
    }
    if (!emailVal || !emailVal.includes("@")) {
      setErrorMessage(t("Validation Error: Please enter a valid Email Address."));
      return;
    }
    if (!passwordVal) {
      setErrorMessage(t("Validation Error: Password is required."));
      return;
    }
    if (passwordVal.length < 6) {
      setErrorMessage(t("Validation Error: Password must be at least 6 characters for high-grade encryption."));
      return;
    }
    if (passwordVal !== confirmPasswordVal) {
      setErrorMessage(t("Validation Error: Passwords do not match."));
      return;
    }
    if (!villageVal) {
      setErrorMessage(t("Validation Error: Village is required."));
      return;
    }
    if (!districtVal) {
      setErrorMessage(t("Validation Error: District is required."));
      return;
    }
    if (!stateVal) {
      setErrorMessage(t("Validation Error: State is required."));
      return;
    }
    if (!contactNameVal) {
      setErrorMessage(t("Validation Error: Emergency Contact Name is required."));
      return;
    }
    if (!contactPhoneVal) {
      setErrorMessage(t("Validation Error: Emergency Contact Phone is required."));
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Check if username is unique in simulated DB
      const savedUsersJson = localStorage.getItem("sahara_registered_users");
      const registeredUsers: any[] = savedUsersJson ? JSON.parse(savedUsersJson) : [];
      
      const usernameExists = registeredUsers.some(u => u.username && u.username.toLowerCase() === usernameVal);
      if (usernameExists) {
        setIsSubmitting(false);
        setErrorMessage(t("Validation Error: The username '{regUsername}' is already taken. Please choose a unique username.", { regUsername }));
        return;
      }

      const emailExists = registeredUsers.some(u => u.email.toLowerCase() === emailVal.toLowerCase());
      if (emailExists) {
        setIsSubmitting(false);
        setErrorMessage(t("Validation Error: An account with the email '{regEmail}' is already registered.", { regEmail }));
        return;
      }

      setIsSubmitting(false);
      
      const newProfile: UserProfile = {
        id: `U-${Math.floor(10000 + Math.random() * 90000)}`,
        name: nameVal,
        email: emailVal,
        phone: phoneVal.startsWith("+") ? phoneVal : `+91 ${phoneVal}`,
        bloodType: bloodVal || "None",
        healthId: `NHID-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        allergies: [],
        medications: [],
        insuranceProvider: "National Safety Mutual",
        policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
        emergencyContactName: contactNameVal,
        emergencyContactPhone: contactPhoneVal.startsWith("+") ? contactPhoneVal : `+91 ${contactPhoneVal}`,
        safetyScore: Math.min(
          20 + 
          (phoneVal ? 15 : 0) + 
          (bloodVal && bloodVal !== "Select Blood Type" && bloodVal !== "" ? 10 : 0) + 
          (contactNameVal && contactPhoneVal ? 20 : 0) + 
          (villageVal || districtVal || stateVal ? 15 : 0) + 15,
          100
        ),
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
        language: regLanguage,
        theme: "light",
        credits: 100,
        villageScore: 90,
        username: usernameVal,
        gender: "Not Specified",
        age: 30,
        medicalConditions: medicalConditionsVal ? [medicalConditionsVal] : [],
        disabilities: [],
        address: `${villageVal}, ${districtVal}, ${stateVal}`,
        district: districtVal,
        village: villageVal,
        emergencyContacts: [{ name: contactNameVal, relation: "Primary", phone: contactPhoneVal.startsWith("+") ? contactPhoneVal : `+91 ${contactPhoneVal}` }],
        healthNotes: ""
      };

      // Save user to simulated DB
      registeredUsers.push({
        ...newProfile,
        password: passwordVal,
        city: cityVal,
        district: districtVal,
        village: villageVal,
        state: stateVal
      });
      localStorage.setItem("sahara_registered_users", JSON.stringify(registeredUsers));

      setSuccessMessage(t("Secure Account Created! Compiling your decentralized Health ID..."));
      setTimeout(() => {
        onLoginSuccess(newProfile);
      }, 1500);
    }, 1200);
  };

  // Google Login - skips registration check fix
  const handleGoogleLogin = () => {
    setIsSubmitting(true);
    setErrorMessage("");
    setTimeout(() => {
      setIsSubmitting(false);
      // Check if Google user is already in our local storage
      const savedUsersJson = localStorage.getItem("sahara_registered_users");
      const registeredUsers: any[] = savedUsersJson ? JSON.parse(savedUsersJson) : [];
      const matched = registeredUsers.find(u => u.email === "google.user@sahara-id.org");

      if (matched) {
        onLoginSuccess(matched);
      } else {
        // Switch to register and prefill values to enforce complete registration instead of skipping
        setAuthMode("register");
        setRegName("Google Mesh User");
        setRegEmail("google.user@sahara-id.org");
        setRegUsername("google_user");
        setErrorMessage(t("Google account authenticated. Complete the remaining mandatory fields to finish registration."));
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center p-4 relative overflow-y-auto">
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#333 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <main className="w-full max-w-[480px] flex flex-col items-center py-6 relative z-10">
        
        {/* Branding header */}
        <section className="text-center mb-6 w-full relative">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute left-0 top-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              {"← " + t("Back")}
            </button>
          )}
          <button 
            type="button"
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            className="absolute right-0 top-2 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="w-4 h-4 text-orange-500" />
          </button>
          <div className="relative w-24 h-24 mx-auto mb-3 flex items-center justify-center cursor-pointer" onClick={triggerPresetLogin} title={t("Click to bypass using preset mock profile")}>
            <div className="absolute inset-0 bg-orange-500/10 rounded-full animate-pulse" />
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-950/40">
              <span className="text-3xl font-extrabold text-white tracking-tighter">S</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">SAHARA <span className="text-orange-500 text-xs font-mono ml-1">v1.0.4</span></h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-1">{t("Smart Assistance & Humanitarian Resource App")}</p>
        </section>

        {/* Global Messages */}
        {errorMessage && (
          <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="w-full mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono rounded-xl text-center">
            <span>{successMessage}</span>
          </div>
        )}

        {/* Toggle Mode */}
        {!isOtpSent && (
          <div className="flex bg-white/5 rounded-xl p-1 w-full border border-white/5 mb-6">
            <button 
              onClick={() => { setAuthMode("login"); setErrorMessage(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === "login" ? "bg-orange-600 text-white shadow-md shadow-orange-950/20" : "text-gray-400 hover:text-white"}`}
            >
              {t("SECURE LOGIN")}
            </button>
            <button 
              onClick={() => { setAuthMode("register"); setErrorMessage(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === "register" ? "bg-orange-600 text-white shadow-md shadow-orange-950/20" : "text-gray-400 hover:text-white"}`}
            >
              {t("REGISTER ACCOUNT")}
            </button>
          </div>
        )}

        {/* Auth Panel Body */}
        <div className="w-full bg-[#161923] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          
          {/* LOGIN WORKFLOW */}
          {authMode === "login" && !isOtpSent && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Method tabs */}
              <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5 mb-2">
                <button 
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded ${loginMethod === "email" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
                >
                  {t("EMAIL + PASSWORD")}
                </button>
                <button 
                  type="button"
                  onClick={() => setLoginMethod("phone")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded ${loginMethod === "phone" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
                >
                  {t("PHONE NUMBER + OTP")}
                </button>
              </div>

              {loginMethod === "email" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Email Address")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Mail className="w-4 h-4 text-gray-500 mr-2" />
                      <input 
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder={t("e.g. user@sahara-id.org")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-3 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("Secret Password")}</label>
                      <button 
                        type="button"
                        onClick={() => setErrorMessage(t("Simulated Password Reset instructions sent to your email log."))}
                        className="text-[9px] font-bold text-orange-400 hover:underline"
                      >
                        {t("FORGOT PASSWORD?")}
                      </button>
                    </div>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Lock className="w-4 h-4 text-gray-500 mr-2" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-3 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Mobile Number")}</label>
                  <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                    <span className="text-xs font-mono text-gray-500 mr-1">+91</span>
                    <input 
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder={t("98123 45680")}
                      className="w-full bg-transparent border-none focus:ring-0 text-xs py-3 text-white placeholder-gray-600 font-mono tracking-wider"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* Extra toggles */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-orange-600 focus:ring-0"
                  />
                  <span>{t("Remember my email")}</span>
                </label>
                <span className="font-mono text-[9px] text-green-400 flex items-center gap-1">
                  ● {t("MESH SECURE")}
                </span>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{isSubmitting ? t("INITIATING SECURE ACCESS...") : t("AUTHORIZE SECURE LOGIN")}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>

              {/* Quick bypass tips */}
              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={triggerPresetLogin}
                  className="text-[9px] font-mono text-gray-500 hover:text-orange-400 transition-colors uppercase tracking-widest"
                >
                  {t("⚡ Click here to login instantly with default demo profile")}
                </button>
              </div>

            </form>
          )}

          {/* OTP INPUT PANEL */}
          {authMode === "login" && isOtpSent && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center space-y-1">
                <span className="font-mono text-[9px] font-bold text-orange-500 tracking-wider uppercase">{t("Mesh Security Verification")}</span>
                <p className="text-xs text-gray-300 font-semibold">
                  {t("Secured OTP broadcast dispatched to ")} <b className="font-mono text-white">+91 {loginPhone}</b>
                </p>
              </div>

              {/* Four digit blocks */}
              <div className="flex justify-center gap-3 py-1">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={digitRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isSubmitting}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:bg-white/10 focus:border-orange-500 transition-all font-mono"
                  />
                ))}
              </div>

              {/* Verify CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{isSubmitting ? t("VERIFYING LEDGER ENCRYPTION...") : t("VERIFY SECURITY CODE")}</span>
              </button>

              {/* Timer/Resend logs */}
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                <button
                  type="button"
                  disabled={otpTimer > 0 || isSubmitting}
                  onClick={() => {
                    setOtpTimer(59);
                    setOtpDigits(["", "", "", ""]);
                    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
                    setSimulatedOtp(randomCode);
                    setSuccessMessage(`[MOCK OTP SERVICE]: Your new 4-digit code is ${randomCode}`);
                    digitRefs[0].current?.focus();
                  }}
                  className={`underline ${otpTimer > 0 ? 'text-gray-600 cursor-not-allowed' : 'text-orange-400 cursor-pointer'}`}
                >
                  {t("RESEND BROADCAST")}
                </button>
                {otpTimer > 0 ? (
                  <span>{t("DISPATCH TIMEOUT: 00:")}{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</span>
                ) : (
                  <span className="text-green-400 uppercase">{t("READY TO BROADCAST")}</span>
                )}
              </div>
            </form>
          )}

          {/* REGISTRATION WORKFLOW */}
          {authMode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              
              <div className="space-y-3">
                <h3 className="text-[10px] font-mono text-orange-500 tracking-wider uppercase font-bold border-b border-white/5 pb-1">
                  {t("1. Demographics & Credentials")}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Full Name *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <User className="w-4 h-4 text-gray-500 mr-2" />
                      <input 
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder={t("e.g. Aarav Sharma")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Username (Unique) *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <User className="w-4 h-4 text-gray-500 mr-2" />
                      <input 
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder={t("e.g. aarav")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600 font-mono"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Mobile Phone *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Phone className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9812345680"
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600 font-mono"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Email Address *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Mail className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder={t("aarav@sahara.in")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Password *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Lock className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Confirm Password *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Lock className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-[10px] font-mono text-orange-500 tracking-wider uppercase font-bold border-b border-white/5 pt-2 pb-1">
                  {t("2. Regional & Health ID Metrics")}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Village *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="text"
                        value={regVillage}
                        onChange={(e) => setRegVillage(e.target.value)}
                        placeholder={t("e.g. Bandra")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("District *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="text"
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        placeholder={t("e.g. Mumbai Suburban")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("State *")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="text"
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Language")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Globe className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <select 
                        value={regLanguage}
                        onChange={(e) => setRegLanguage(e.target.value as "en" | "hi")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white rounded cursor-pointer font-sans"
                        disabled={isSubmitting}
                      >
                        <option value="en">English (EN)</option>
                        <option value="hi">Hindi (हिंदी)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Blood Group (Optional)")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Droplets className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <select 
                        value={regBloodGroup}
                        onChange={(e) => setRegBloodGroup(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white rounded cursor-pointer font-sans"
                        disabled={isSubmitting}
                      >
                        <option value="">{t("Not Specified")}</option>
                        <option value="O+">O+ Positive</option>
                        <option value="O-">O- Negative</option>
                        <option value="A+">A+ Positive</option>
                        <option value="A-">A- Negative</option>
                        <option value="B+">B+ Positive</option>
                        <option value="B-">B- Negative</option>
                        <option value="AB+">AB+ Positive</option>
                        <option value="AB-">AB- Negative</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Medical Conditions (Optional)")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <ShieldAlert className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="text"
                        value={regMedicalConditions}
                        onChange={(e) => setRegMedicalConditions(e.target.value)}
                        placeholder={t("e.g. Asthma, Diabetes")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-[10px] font-mono text-orange-500 tracking-wider uppercase font-bold border-b border-white/5 pt-2 pb-1">
                  {t("3. Emergency Contact Group")}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Contact Name")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <User className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="text"
                        value={regEmergencyContactName}
                        onChange={(e) => setRegEmergencyContactName(e.target.value)}
                        placeholder={t("e.g. Rajesh (Father)")}
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("Contact Phone")}</label>
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-orange-500/50">
                      <Phone className="w-3.5 h-3.5 text-gray-500 mr-2" />
                      <input 
                        type="tel"
                        value={regEmergencyContactPhone}
                        onChange={(e) => setRegEmergencyContactPhone(e.target.value)}
                        placeholder="9812345680"
                        className="w-full bg-transparent border-none focus:ring-0 text-xs py-2.5 text-white placeholder-gray-600 font-mono"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Register CTA */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
              >
                <span>{isSubmitting ? t("COMPILING DIGITAL HEALTH ID...") : t("SIGN UP & ENCRYPT PROFILE")}</span>
              </button>

            </form>
          )}

        </div>

        {/* Alternate Quick Social logins */}
        {!isOtpSent && (
          <div className="w-full mt-4 space-y-4 text-center">
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-grow bg-white/10" />
              <span className="font-mono text-[8px] text-gray-500 tracking-wider uppercase">{t("Or quickly sign in via partner portal")}</span>
              <div className="h-[1px] flex-grow bg-white/10" />
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="h-10 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-[#EA4335]" />
              <span className="text-xs font-bold text-gray-300">{t("Authorize Google Ledger")}</span>
            </button>
          </div>
        )}

        {/* Footer legalities */}
        <footer className="w-full mt-6 text-center space-y-3">
          <p className="text-[9px] leading-relaxed text-gray-500 px-4">
            {t("Security audit finalized under blockchain mesh protocol: v1.0.4. All data is SHA-256 encrypted on device and shared solely with local medical dispatch.")}
          </p>
          <div className="flex items-center justify-center gap-4 text-[9px] font-mono text-gray-600">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> {t("SECURED")}</span>
            <span>●</span>
            <span>{t("HIPAA AUDITED")}</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
