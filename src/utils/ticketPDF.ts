import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { GatePassTicket, TicketQRData } from '../types/ticket';

interface TicketPDFData {
  ticket: GatePassTicket;
  qrCodeDataUrl: string;
}

// Use existing school details from the header
const SCHOOL_CONFIG = {
  school_name: 'Modern Higher Secondary School',
  school_subtitle: 'Pottur',
  address: 'Mudur P.O., Vattamkulam Via, Edappal, Malappuram, Kerala - 679578',
  primary_phone: '9645499929',
  secondary_phone: '9745499928',
  email: 'modernpotur@gmail.com',
  dhse_code: '11181',
  school_logo_url: '/lovable-uploads/d6a40436-db2a-426b-8cac-f4b879c3f89a.png'
};

// Helper function to convert image URL to base64
const imageUrlToBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
};

export const generateTicketPDF = async (ticket: GatePassTicket, qrCodeDataUrl: string): Promise<void> => {
  console.log('📄 generateTicketPDF: Starting PDF generation with ticket:', ticket);
  console.log('📄 generateTicketPDF: QR code data URL length:', qrCodeDataUrl?.length || 0);
  
  try {
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    console.log('📄 generateTicketPDF: jsPDF instance created successfully');

  // Set up colors
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [52, 73, 94]; // Dark gray
  const accentColor = [231, 76, 60]; // Red
  const lightGray = [236, 240, 241];

  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);

  // Helper function to add background
  const addBackground = () => {
    // Header background
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 60, 'F');
    
    // Accent stripe
    pdf.setFillColor(...accentColor);
    pdf.rect(0, 55, pageWidth, 5, 'F');
    
    // Light background for content area
    pdf.setFillColor(...lightGray);
    pdf.rect(margin, 70, contentWidth, 120, 'F');
  };

  // Helper function to add school logo
  const addSchoolLogo = async () => {
    try {
      // Convert logo to base64 and add to PDF
      const logoBase64 = await imageUrlToBase64(SCHOOL_CONFIG.school_logo_url);
      if (logoBase64) {
        pdf.addImage(logoBase64, 'PNG', 25, 15, 20, 20);
      } else {
        // Fallback: Add a placeholder circle with school initials
        pdf.setFillColor(255, 255, 255);
        pdf.circle(35, 25, 10);
        pdf.setFillColor(59, 130, 246); // Blue color
        pdf.circle(35, 25, 8);
        
        // Add school initials
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MHS', 31, 28);
      }
    } catch (error) {
      console.error('Error adding school logo:', error);
      // Fallback design
      pdf.setFillColor(59, 130, 246);
      pdf.circle(35, 25, 10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MHS', 31, 28);
    }
  };

  // Add background
  addBackground();

  // Add school logo
  await addSchoolLogo();

  // Add school header
  const addSchoolHeader = () => {
    // School name
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(SCHOOL_CONFIG.school_name, pageWidth / 2, 20, { align: 'center' });
    
    // School subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(SCHOOL_CONFIG.school_subtitle, pageWidth / 2, 27, { align: 'center' });
    
    // School address
    pdf.setFontSize(9);
    pdf.text(SCHOOL_CONFIG.address, pageWidth / 2, 34, { align: 'center' });
    
    // Contact info
    const contactInfo = `Phone: ${SCHOOL_CONFIG.primary_phone}, ${SCHOOL_CONFIG.secondary_phone} | Email: ${SCHOOL_CONFIG.email}`;
    pdf.text(contactInfo, pageWidth / 2, 40, { align: 'center' });
    
    // DHSE Code
    pdf.setFontSize(8);
    pdf.text(`DHSE Code: ${SCHOOL_CONFIG.dhse_code}`, pageWidth / 2, 45, { align: 'center' });
    
    // Divider line
    pdf.setLineWidth(0.5);
    pdf.line(20, 50, pageWidth - 20, 50);
  };

  addSchoolHeader();

  // Add ticket title
  const addTicketTitle = () => {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246); // Blue color
    pdf.text('GATE PASS TICKET', pageWidth / 2, 65, { align: 'center' });
    
    // Ticket number
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Ticket #: ${ticket.ticket_number}`, pageWidth / 2, 75, { align: 'center' });
  };

  addTicketTitle();

  // Add visitor information
  const addVisitorInfo = () => {
    const startY = 90;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    // Format entry date/time
    const entryDateTime = `${ticket.permitted_entry_date} ${ticket.permitted_entry_time}`;
    const formattedEntryTime = new Date(entryDateTime).toLocaleString();
    
    // Format exit date/time if available
    let formattedExitTime = 'Not specified';
    if (ticket.permitted_exit_date && ticket.permitted_exit_time) {
      const exitDateTime = `${ticket.permitted_exit_date} ${ticket.permitted_exit_time}`;
      formattedExitTime = new Date(exitDateTime).toLocaleString();
    }
    
    const info = [
      ['Visitor Name:', ticket.gate_pass_requests?.name || 'N/A'],
      ['Purpose:', ticket.gate_pass_requests?.purpose || 'N/A'],
      ['Mobile:', ticket.gate_pass_requests?.mobile_number || 'N/A'],
      ['Entry Time:', formattedEntryTime],
      ['Status:', ticket.entry_status || 'pending']
    ];
    
    info.forEach(([label, value], index) => {
      const y = startY + (index * 12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 25, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 70, y);
    });
  };

  addVisitorInfo();

  // Add QR code
  const addQRCode = () => {
    const qrSize = 40;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 165;
    
    // Add QR code image
    pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    
    // QR code label
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Scan for verification', pageWidth / 2, qrY + qrSize + 10, { align: 'center' });
  };

  addQRCode();

  // Add footer
  const addFooter = () => {
    const footerY = 235;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    
    pdf.text('This is a digitally generated ticket. Please present this along with valid ID.', pageWidth / 2, footerY, { align: 'center' });
    pdf.text('For any queries, contact the school office.', pageWidth / 2, footerY + 8, { align: 'center' });
    
    // Border
    pdf.setLineWidth(1);
    pdf.setDrawColor(59, 130, 246);
    pdf.rect(15, 10, pageWidth - 30, 270);
  };

  addFooter();

    // Download the PDF
    const fileName = `gate-pass-ticket-${ticket.ticket_number}.pdf`;
    console.log('📄 generateTicketPDF: Attempting to download PDF with filename:', fileName);
    
    // Check if pdf.save is available
    if (typeof pdf.save !== 'function') {
      console.error('❌ generateTicketPDF: pdf.save is not a function');
      throw new Error('PDF save function is not available');
    }
    
    pdf.save(fileName);
    console.log('✅ generateTicketPDF: PDF download initiated successfully');
    
  } catch (error) {
    console.error('❌ generateTicketPDF: Error during PDF generation:', error);
    throw error;
  }
};
