
import React from 'react';
import { CheckIcon, XMarkIcon } from '../constants';

const featuresData = [
  { feature: 'AI Property Analyses', free: '3 Total', starter: '15 / mo', experienced: '40 / mo', pro: '100 / mo', team: 'Unlimited' },
  { feature: 'Standard Rental Analysis', free: true, starter: true, experienced: true, pro: true, team: true },
  { feature: 'Property Comparison Tool', free: false, starter: true, experienced: true, pro: true, team: true },
  { feature: 'Export Data (CSV/PDF)', free: false, starter: false, experienced: true, pro: true, team: true },
  { feature: 'Wholesale MAO Calculator', free: false, starter: false, experienced: false, pro: true, team: true },
  { feature: 'Subject-To Calculator', free: false, starter: false, experienced: false, pro: true, team: true },
  { feature: 'Seller Financing Calculator', free: false, starter: false, experienced: false, pro: true, team: true },
  { feature: 'Save Properties to Browser', free: true, starter: true, experienced: true, pro: true, team: true },
  { feature: 'Email Support', free: false, starter: true, experienced: true, pro: 'Priority', team: 'Dedicated' },
  { feature: 'Team Collaboration', free: false, starter: false, experienced: false, pro: false, team: 'Coming Soon' },
];

const renderCheckmark = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? <CheckIcon className="h-6 w-6 text-green-500 mx-auto" /> : <XMarkIcon className="h-6 w-6 text-gray-400 mx-auto" />;
    }
    return <span className="text-sm font-semibold text-gray-800">{value}</span>;
};

const FeaturesTable = () => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-sm font-semibold text-gray-600">Feature</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Free</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Starter</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Experienced</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Pro</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {featuresData.map(({ feature, free, starter, experienced, pro, team }) => (
                  <tr key={feature}>
                    <td className="p-4 font-medium text-gray-700">{feature}</td>
                    <td className="p-4 text-center">{renderCheckmark(free)}</td>
                    <td className="p-4 text-center">{renderCheckmark(starter)}</td>
                    <td className="p-4 text-center">{renderCheckmark(experienced)}</td>
                    <td className="p-4 text-center">{renderCheckmark(pro)}</td>
                    <td className="p-4 text-center">{renderCheckmark(team)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    );
};

export default FeaturesTable;
