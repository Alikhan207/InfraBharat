
import { useLanguage } from "@/components/language-provider";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-infra-green-500 to-infra-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IB</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">{t("app.title")}</h3>
                <p className="text-sm text-gray-400">{t("app.subtitle")}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Building sustainable and resilient cities through AI-powered infrastructure management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-gray-300 hover:text-infra-green-400 transition-colors">{t("nav.features")}</a></li>
              <li><a href="#about" className="text-gray-300 hover:text-infra-green-400 transition-colors">{t("nav.about")}</a></li>
              <li><a href="/login" className="text-gray-300 hover:text-infra-green-400 transition-colors">{t("nav.login")}</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-infra-green-400 transition-colors">{t("nav.contact")}</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-300">Drainage Analysis</li>
              <li className="text-gray-300">Flood Prediction</li>
              <li className="text-gray-300">Route Planning</li>
              <li className="text-gray-300">Environmental Solutions</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Email: contact@infraBharat.gov.in</li>
              <li>Phone: +91 11 2345 6789</li>
              <li>Address: New Delhi, India</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 InfraBharat. All rights reserved. | Built for Digital India Initiative
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
