import { Property } from '../types';

const STORAGE_KEY_PREFIX = 'it_pencils_properties_';

const getStorageKey = (userId: string) => `${STORAGE_KEY_PREFIX}${userId}`;

// Helper to simulate network delay for a realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const localPropertyService = {
  async getProperties(userId: string): Promise<Property[]> {
    await delay(300); // Simulate network latency
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  async addProperty(userId: string, propertyData: Omit<Property, 'id'>): Promise<Property> {
    await delay(300);
    const properties = await this.getProperties(userId);
    
    // Generate a local ID (simple timestamp + random string)
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newProperty: Property = { 
      ...propertyData, 
      id 
    } as Property;

    const updatedProperties = [newProperty, ...properties];
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updatedProperties));
    
    return newProperty;
  },

  async updateProperty(userId: string, id: string, propertyData: Property): Promise<Property> {
    await delay(300);
    const properties = await this.getProperties(userId);
    
    const index = properties.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Property not found locally');
    }

    properties[index] = propertyData;
    localStorage.setItem(getStorageKey(userId), JSON.stringify(properties));
    
    return propertyData;
  },

  async deleteProperty(userId: string, id: string): Promise<void> {
    await delay(300);
    const properties = await this.getProperties(userId);
    const filteredProperties = properties.filter(p => p.id !== id);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(filteredProperties));
  }
};