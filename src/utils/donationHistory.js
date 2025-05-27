import { ethers } from 'ethers';
import { DONATION_PLATFORM } from '../contracts';

// Donation history utility functions
export class DonationHistoryService {
  constructor(provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(
      DONATION_PLATFORM.ADDRESS,
      DONATION_PLATFORM.ABI,
      provider
    );
  }

  // Get donation events with pagination
  async getDonationHistory(page = 1, pageSize = 5, filters = {}) {
    try {
      console.log(`Fetching donation history - Page: ${page}, Size: ${pageSize}`);
      
      // Get current block number
      const currentBlock = await this.provider.getBlockNumber();
      
      // Calculate block range (last ~30 days, assuming 12 second blocks)
      const blocksPerDay = Math.floor(24 * 60 * 60 / 12); // ~7200 blocks per day
      const searchBlocks = blocksPerDay * 30; // Last 30 days
      const fromBlock = Math.max(0, currentBlock - searchBlocks);
      
      console.log(`Searching from block ${fromBlock} to ${currentBlock}`);

      // Create filter for donated events
      const eventFilter = this.contract.filters.donated(
        filters.donor || null,     // donor address filter
        filters.receiver || null,  // receiver address filter
        null                       // time (we'll sort by this)
      );

      // Get all donation events
      const events = await this.contract.queryFilter(
        eventFilter,
        fromBlock,
        currentBlock
      );

      console.log(`Found ${events.length} total donation events`);

      // Parse and format events
      const formattedEvents = await Promise.all(
        events.map(async (event) => {
          try {
            // Get block details for timestamp
            const block = await this.provider.getBlock(event.blockNumber);
            
            // Parse event data
            const { donor, receiver, time, amount, tokenSymbol } = event.args;
            
            // Get transaction details
            const tx = await this.provider.getTransaction(event.transactionHash);
            
            return {
              id: `${event.transactionHash}-${event.logIndex}`,
              donor: donor,
              receiver: receiver,
              amount: ethers.formatEther(amount),
              tokenSymbol: tokenSymbol,
              timestamp: Number(time),
              date: new Date(Number(time) * 1000).toLocaleDateString(),
              time: new Date(Number(time) * 1000).toLocaleTimeString(),
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              blockTimestamp: block.timestamp,
              gasUsed: tx.gasLimit ? ethers.formatEther(tx.gasLimit) : 'N/A'
            };
          } catch (error) {
            console.error('Error parsing event:', error);
            return null;
          }
        })
      );

      // Filter out null events and sort by timestamp (newest first)
      const validEvents = formattedEvents
        .filter(event => event !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedEvents = validEvents.slice(startIndex, endIndex);

      // Calculate pagination info
      const totalEvents = validEvents.length;
      const totalPages = Math.ceil(totalEvents / pageSize);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        events: paginatedEvents,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalEvents: totalEvents,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          startIndex: startIndex + 1,
          endIndex: Math.min(endIndex, totalEvents)
        }
      };

    } catch (error) {
      console.error('Error fetching donation history:', error);
      throw new Error(`Failed to fetch donation history: ${error.message}`);
    }
  }

  // Get donation statistics
  async getDonationStats() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const blocksPerDay = Math.floor(24 * 60 * 60 / 12);
      const fromBlock = Math.max(0, currentBlock - (blocksPerDay * 30));

      const events = await this.contract.queryFilter(
        this.contract.filters.donated(),
        fromBlock,
        currentBlock
      );

      const totalDonations = events.length;
      const totalAmount = events.reduce((sum, event) => {
        return sum + parseFloat(ethers.formatEther(event.args.amount));
      }, 0);

      const uniqueDonors = new Set(events.map(event => event.args.donor)).size;
      const uniqueReceivers = new Set(events.map(event => event.args.receiver)).size;

      return {
        totalDonations,
        totalAmount: totalAmount.toFixed(4),
        uniqueDonors,
        uniqueReceivers,
        averageDonation: totalDonations > 0 ? (totalAmount / totalDonations).toFixed(4) : 0
      };

    } catch (error) {
      console.error('Error fetching donation stats:', error);
      return {
        totalDonations: 0,
        totalAmount: '0',
        uniqueDonors: 0,
        uniqueReceivers: 0,
        averageDonation: '0'
      };
    }
  }

  // Get user's donation history
  async getUserDonations(userAddress, page = 1, pageSize = 20) {
    return this.getDonationHistory(page, pageSize, { donor: userAddress });
  }

  // Get donations to a specific receiver
  async getReceiverDonations(receiverAddress, page = 1, pageSize = 20) {
    return this.getDonationHistory(page, pageSize, { receiver: receiverAddress });
  }

  // Real-time event listener
  setupEventListener(callback) {
    const eventFilter = this.contract.filters.donated();
    
    this.contract.on(eventFilter, async (event) => {
      try {
        const { donor, receiver, time, amount, tokenSymbol } = event.args;
        const block = await this.provider.getBlock(event.blockNumber);
        
        const formattedEvent = {
          id: `${event.transactionHash}-${event.logIndex}`,
          donor,
          receiver,
          amount: ethers.formatEther(amount),
          tokenSymbol,
          timestamp: Number(time),
          date: new Date(Number(time) * 1000).toLocaleDateString(),
          time: new Date(Number(time) * 1000).toLocaleTimeString(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          blockTimestamp: block.timestamp
        };

        callback(formattedEvent);
      } catch (error) {
        console.error('Error processing real-time event:', error);
      }
    });

    return () => {
      this.contract.removeAllListeners(eventFilter);
    };
  }
} 