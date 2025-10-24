import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  gender: z.enum(["boy", "girl"], { required_error: "Please select gender" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  houseName: z.string().min(2, "House name is required"),
  landmark: z.string().optional(),
  postOffice: z.string().min(2, "Post office is required"),
  village: z.string().min(2, "Village is required"),
  pincode: z.string().min(6, "Pincode must be at least 6 digits"),
  district: z.string().min(2, "District is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  tenthSchool: z.string().min(2, "10th school is required"),
  board: z.string().min(1, "Please select board"),
  examRollNumber: z.string().min(1, "Exam roll number is required"),
  examYear: z.string().min(4, "Exam year is required"),
  stream: z.string().min(1, "Please select stream"),
  // Academic Performance Fields
  tenthTotalMarks: z.number().min(1, "Total marks is required").max(1000, "Total marks cannot exceed 1000"),
  tenthObtainedMarks: z.number().min(0, "Obtained marks cannot be negative"),
  tenthPercentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100"),
  tenthGrade: z.string().optional(),
  tenthResult: z.enum(["pass", "fail", "compartment"], { required_error: "Please select result" }),
  mathematicsMarks: z.number().min(0, "Mathematics marks cannot be negative").optional(),
  scienceMarks: z.number().min(0, "Science marks cannot be negative").optional(),
  englishMarks: z.number().min(0, "English marks cannot be negative").optional(),
  socialScienceMarks: z.number().min(0, "Social Science marks cannot be negative").optional(),
  languageMarks: z.number().min(0, "Language marks cannot be negative").optional(),
  additionalSubject1: z.string().optional(),
  additionalSubject1Marks: z.number().min(0, "Additional subject 1 marks cannot be negative").optional(),
  additionalSubject2: z.string().optional(),
  additionalSubject2Marks: z.number().min(0, "Additional subject 2 marks cannot be negative").optional(),
  hasSiblings: z.boolean().default(false),
  siblingsNames: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function PlusOneApplicationForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasSiblings: false,
    }
  });

  // Ensure no native form submission refreshes the page
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit(onSubmit)(e);
  };

  const watchedHasSiblings = form.watch("hasSiblings");

  const generateApplicationNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000) + 1000;
    return `MHS${year}-${randomNum}`;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let tries = 0;
      let lastError: Error | null = null;
      while (tries < 3) {
        const applicationNumber = generateApplicationNumber();
        const { error } = await supabase
          .from('plus_one_applications')
          .insert([{
            application_number: applicationNumber,
            full_name: data.fullName,
            gender: data.gender,
            date_of_birth: data.dateOfBirth,
            father_name: data.fatherName,
            mother_name: data.motherName,
            house_name: data.houseName,
            landmark: data.landmark || null,
            post_office: data.postOffice,
            village: data.village,
            pincode: data.pincode,
            district: data.district,
            email: data.email || null,
            mobile_number: data.mobileNumber,
            tenth_school: data.tenthSchool,
            board: data.board,
            exam_roll_number: data.examRollNumber,
            exam_year: data.examYear,
            stream: data.stream,
            // Academic Performance Data
            tenth_total_marks: data.tenthTotalMarks,
            tenth_obtained_marks: data.tenthObtainedMarks,
            tenth_percentage: data.tenthPercentage,
            tenth_grade: data.tenthGrade || null,
            tenth_result: data.tenthResult,
            mathematics_marks: data.mathematicsMarks || null,
            science_marks: data.scienceMarks || null,
            english_marks: data.englishMarks || null,
            social_science_marks: data.socialScienceMarks || null,
            language_marks: data.languageMarks || null,
            additional_subject_1: data.additionalSubject1 || null,
            additional_subject_1_marks: data.additionalSubject1Marks || null,
            additional_subject_2: data.additionalSubject2 || null,
            additional_subject_2_marks: data.additionalSubject2Marks || null,
            has_siblings: data.hasSiblings,
            siblings_names: data.siblingsNames || null,
          }]);
        if (!error) {
          navigate(`/admissions/success?type=plus-one&app=${encodeURIComponent(applicationNumber)}&mobile=${encodeURIComponent(data.mobileNumber)}`);
          return;
        }
        lastError = error;
        const msg = error?.message || "";
        if (!(msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505'))) break;
        tries++;
      }
      throw lastError || new Error('Failed to submit application');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit application. Please try again.";
      toast({
        title: "Submission Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">+1 / HSS Application Form</h1>
          <p className="text-muted-foreground">Academic Year: 2025-26</p>
        </div>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="boy" id="boy" />
                            <label htmlFor="boy">Boy</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="girl" id="girl" />
                            <label htmlFor="girl">Girl</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter father's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mother's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="houseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter house name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landmark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landmark (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter landmark" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postOffice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Office</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter post office" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Panchayath</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter panchayath" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pincode" {...field} />
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
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter district" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Academic Details */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="tenthSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>10th School</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter 10th school name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="board"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select board" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SSLC">SSLC</SelectItem>
                          <SelectItem value="CBSE">CBSE</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examRollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Roll Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter exam roll number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Year</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter exam year (e.g., 2024)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Academic Performance */}
            <Card>
              <CardHeader>
                <CardTitle>10th Grade Academic Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tenthTotalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 500" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tenthObtainedMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Obtained Marks</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 450" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tenthPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 90.5" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tenthGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., A+, A, B+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tenthResult"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                          <SelectItem value="compartment">Compartment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Subject-wise Marks */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Marks (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mathematicsMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mathematics</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter marks" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scienceMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Science</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter marks" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="englishMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>English</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter marks" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialScienceMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Science</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter marks" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="languageMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Second Language</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter marks" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="additionalSubject1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Subject 1</FormLabel>
                          <FormControl>
                            <Input placeholder="Subject name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalSubject1Marks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marks</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter marks" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="additionalSubject2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Subject 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Subject name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalSubject2Marks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marks</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter marks" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stream Choice */}
            <Card>
              <CardHeader>
                <CardTitle>Stream Choice</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="stream"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stream" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="biology_science">Biology Science</SelectItem>
                          <SelectItem value="computer_science">Computer Science</SelectItem>
                          <SelectItem value="commerce">Commerce</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Siblings Details */}
            <Card>
              <CardHeader>
                <CardTitle>Siblings Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasSiblings"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Has siblings in this school?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {watchedHasSiblings && (
                  <FormField
                    control={form.control}
                    name="siblingsNames"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Siblings' Names</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter siblings' names and their classes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
