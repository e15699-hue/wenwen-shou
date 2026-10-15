import 'package:flutter/material.dart';

/// 雙選項大按鈕（小孩可點可說）
class ChoiceButtons extends StatelessWidget {
  final List<String> choices;
  final void Function(String) onTap;
  const ChoiceButtons({super.key, required this.choices, required this.onTap});

  @override
  Widget build(BuildContext context) {
    if (choices.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: choices
            .map((c) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => onTap(c),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4ECDC4),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30)),
                      ),
                      child: Text(c, style: const TextStyle(fontSize: 20)),
                    ),
                  ),
                ))
            .toList(),
      ),
    );
  }
}
