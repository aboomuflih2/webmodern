import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap, Heart, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const JoinOurTeam = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join Our Team
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Be part of our mission to shape young minds and build a brighter future. 
            We're looking for passionate educators and dedicated professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Collaborative Environment</h3>
              <p className="text-sm text-gray-600">
                Work with a supportive team of dedicated professionals
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <GraduationCap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Professional Growth</h3>
              <p className="text-sm text-gray-600">
                Continuous learning opportunities and career advancement
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Meaningful Impact</h3>
              <p className="text-sm text-gray-600">
                Make a real difference in students' lives and communities
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Recognition &amp; Rewards</h3>
              <p className="text-sm text-gray-600">
                Competitive compensation and recognition programs
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Ready to Make a Difference?
              </h3>
              <p className="text-gray-600 mb-6">
                We're always looking for talented individuals who share our passion for education. 
                Whether you're an experienced educator or just starting your career, we have 
                opportunities for you to grow and make an impact.
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Teaching positions across all subjects
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Administrative and support roles
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Flexible working arrangements
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Professional development opportunities
                </li>
              </ul>
            </div>
            
            <div className="text-center lg:text-right">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-lg">
                <h4 className="text-xl font-semibold mb-4">Start Your Journey Today</h4>
                <p className="mb-6 opacity-90">
                  Join our team and be part of something meaningful. Apply now and help us 
                  shape the future of education.
                </p>
                <Link to="/careers">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                  >
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinOurTeam;