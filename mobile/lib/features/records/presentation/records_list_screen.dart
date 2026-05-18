import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'providers/records_provider.dart';
import 'record_detail_screen.dart';

class RecordsListScreen extends ConsumerWidget {
  const RecordsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recordsAsync = ref.watch(unifiedRecordsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Records Registry'),
        actions: [
          IconButton(
            icon: Icon(PhosphorIcons.funnel()),
            onPressed: () => ref.refresh(unifiedRecordsProvider),
          ),
        ],
      ),
      body: recordsAsync.when(
        data: (records) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: records.length,
          itemBuilder: (context, index) {
            final record = records[index];
            return GestureDetector(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => RecordDetailScreen(record: record),
                ),
              ),
              child: _buildRecordCard(
                context,
                id: record.id,
                type: record.type,
                status: record.status,
                amount: record.amount,
                date: record.date,
                detail: record.detail,
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: ${err.toString()}'),
              ElevatedButton(
                onPressed: () => ref.refresh(unifiedRecordsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: const Color(0xFF0066FF),
        child: Icon(PhosphorIcons.plus(), color: Colors.white),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return const Color(0xFF00C853);
      case 'Pending':
      case 'Pending Approval':
        return const Color(0xFFFFB800);
      case 'Archived':
        return Colors.white24;
      default:
        return const Color(0xFF0066FF);
    }
  }

  Widget _buildRecordCard(
    BuildContext context, {
    required String id,
    required String type,
    required String status,
    required String amount,
    required String date,
    required String detail,
  }) {
    final statusColor = _getStatusColor(status);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                id,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            type,
            style: const TextStyle(color: Colors.white54, fontSize: 13),
          ),
          const Divider(height: 24, color: Colors.white10),
          Text(
            detail,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Detail/Amount',
                    style: TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                  Text(
                    amount,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'Date',
                    style: TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                  Text(
                    date,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
