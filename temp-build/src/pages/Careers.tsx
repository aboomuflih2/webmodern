import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useJobApplications } from '@/hooks/useJobApplications';
import { JobApplicationFormData } from '@/types/job-applications';
import { Upload, FileText, CheckCircle } from 'lucide-react';

const jobApplicationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  district: z.string().min(1, 'District is required'),
  designation: z.string().min(1, 'Designation is required'),
  subject: z.string().optional(),
  other_designation: z.string().optional(),
  qualifications: z.string().min(1, 'Qualification is required'),
  experience_years: z.number().min(0, 'Experience years must be 0 or greater'),
  previous_experience: z.string().optional(),
  why_join: z.string().min(50, 'Please provide at least 50 characters explaining why you want to join'),
}).refine((data) => {
  if (data.designation === 'Teacher' && !data.subject) {
    return false;
  }
  if (data.designation === 'Other' && !data.other_designation) {
    return false;
  }
  return true;
}, {
  message: 'Subject is required for teaching positions, and specification is required for other positions',
  path: ['subject']
});

type JobApplicationForm = z.infer<typeof jobApplicationSchema>;

const Careers: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submitApplication, loading } = useJobApplications();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<JobApplicationForm>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      address: '',
      district: '',
      designation: '',
      subject: '',
      other_designation: '',
      qualifications: '',
      experience_years: 0,
      previous_experience: '',
      why_join: '',
    },
  });

  const watchDesignation = form.watch('designation');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setCvFile(file);
    }
  };

  const onSubmit = async (data: JobApplicationForm) => {
    try {
      const formData: JobApplicationFormData = {
        ...data,
        cv_file: cvFile,
      };

      await submitApplication(formData, (progress) => {
        setUploadProgress(progress);
      });

      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully. We will contact you soon.",
      });

      // Reset form
      form.reset();
      setCvFile(null);
      setUploadProgress(0);
      
      // Navigate to home page
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Be part of our mission to provide quality education and shape the future of our students.
            We're looking for passionate educators and dedicated professionals.
          </p>
        </div>

        {/* Application Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Job Application Form</CardTitle>
            <CardDescription className="text-center">
              Please fill out all required fields to submit your application. CV/Resume upload is optional but recommended.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter your complete address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your district" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Professional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designation *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select designation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Teacher">Teacher</SelectItem>
                              <SelectItem value="Assistant Teacher">Assistant Teacher</SelectItem>
                              <SelectItem value="Lab Assistant">Lab Assistant</SelectItem>
                              <SelectItem value="Librarian">Librarian</SelectItem>
                              <SelectItem value="Office Staff">Office Staff</SelectItem>
                              <SelectItem value="Support Staff">Support Staff</SelectItem>
                              <SelectItem value="Vehicle Staff">Vehicle Staff</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchDesignation === 'Teacher' && (
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter subject you teach" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {watchDesignation === 'Other' && (
                      <FormField
                        control={form.control}
                        name="other_designation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specify Designation *</FormLabel>
                            <FormControl>
                              <Input placeholder="Please specify your designation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="qualifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Highest Qualification *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your highest qualification" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="experience_years"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Enter years of experience" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="previous_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Experience (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your previous work experience" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="why_join"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why do you want to join our school? *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us why you want to be part of our team (minimum 50 characters)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* CV Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    CV/Resume Upload (Optional but Recommended)
                  </h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="cv-upload"
                    />
                    <label htmlFor="cv-upload" className="cursor-pointer">
                      {cvFile ? (
                        <div className="flex items-center justify-center space-x-2 text-green-600">
                          <CheckCircle className="h-8 w-8" />
                          <div>
                            <p className="font-medium">{cvFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-gray-400" />
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              Upload your CV/Resume
                            </p>
                            <p className="text-sm text-gray-500">
                              PDF, DOC, or DOCX files up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full py-3 text-lg" 
                    disabled={loading || uploadProgress > 0}
                  >
                    {loading ? 'Submitting Application...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">What happens next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Application Review</p>
                  <p className="text-gray-600">We'll review your application within 3-5 business days</p>
                </div>
                <div>
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Initial Screening</p>
                  <p className="text-gray-600">Qualified candidates will be contacted for an interview</p>
                </div>
                <div>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Final Decision</p>
                  <p className="text-gray-600">We'll notify you of our decision within 2 weeks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Careers;
