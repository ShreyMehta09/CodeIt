import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Code2, 
  BarChart3, 
  Users, 
  Trophy, 
  ArrowRight,
  CheckCircle,
  Star,
  Github,
  ExternalLink
} from 'lucide-react';
import Button from '../components/UI/Button';

const Landing = () => {
  const features = [
    {
      icon: Code2,
      title: 'Multi-Platform Tracking',
      description: 'Track your progress across LeetCode, Codeforces, CodeChef, AtCoder, and more platforms in one place.'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Get insights into your solving patterns, difficulty progression, and performance trends.'
    },
    {
      icon: Users,
      title: 'Community Features',
      description: 'Share your profile, compete with friends, and discover popular problem sheets.'
    },
    {
      icon: Trophy,
      title: 'Achievement System',
      description: 'Earn badges, maintain streaks, and celebrate your competitive programming milestones.'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Software Engineer at Google',
      content: 'Codolio helped me track my progress systematically and land my dream job. The analytics are incredibly detailed!',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=3b82f6&color=ffffff'
    },
    {
      name: 'Sarah Johnson',
      role: 'Competitive Programmer',
      content: 'The multi-platform integration is seamless. I can finally see all my achievements in one dashboard.',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=10b981&color=ffffff'
    },
    {
      name: 'Raj Patel',
      role: 'CS Student',
      content: 'The sheet feature is amazing for organizing study plans. Helped me prepare for interviews efficiently.',
      avatar: 'https://ui-avatars.com/api/?name=Raj+Patel&background=f59e0b&color=ffffff'
    }
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+' },
    { label: 'Problems Tracked', value: '1M+' },
    { label: 'Platforms Supported', value: '5+' },
    { label: 'Success Stories', value: '500+' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Codolio</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link to="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Track Your
              <span className="text-primary-600"> Competitive Programming</span>
              <br />Journey
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Unify your coding progress across multiple platforms. Get detailed analytics, 
              organize your practice with custom sheets, and showcase your achievements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Tracking Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help competitive programmers track, 
              analyze, and improve their coding skills.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Developers Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our community has to say about their experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Level Up Your Coding Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already tracking their progress 
            and achieving their competitive programming goals.
          </p>
          <Link to="/auth/register">
            <Button variant="secondary" size="lg">
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Codolio</h3>
              <p className="text-gray-400">
                The ultimate platform for competitive programming progress tracking.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Codolio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;