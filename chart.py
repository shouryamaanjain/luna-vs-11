import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.font_manager as fm
import numpy as np
from matplotlib.patches import Rectangle, FancyBboxPatch
from matplotlib.colors import LinearSegmentedColormap
import os

# Load Gilroy fonts
font_dir = os.path.join(os.path.dirname(__file__), 'gilroy-font')
gilroy_regular = fm.FontProperties(fname=os.path.join(font_dir, 'Gilroy-Regular.ttf'))
gilroy_medium = fm.FontProperties(fname=os.path.join(font_dir, 'Gilroy-Medium.ttf'))
gilroy_bold = fm.FontProperties(fname=os.path.join(font_dir, 'Gilroy-Bold.ttf'))
gilroy_semibold = fm.FontProperties(fname=os.path.join(font_dir, 'Gilroy-SemiBold.ttf'))

# Data - order: GSM8k, MATH500, AIME 2025
models = ['Corpus-r1 (4b)', 'Claude-3.7-sonnet', 'Qwen3 (32b)', 'Phi-4 (14b)', 'Gemma-3 (4b)']
benchmarks = ['GSM8K', 'MATH500', 'AIME 2025']

# Scores [GSM8k, MATH500, AIME 2025]
scores = {
    'Corpus-r1 (4b)': [94.2, 87.3, 23.7],
    'Claude-3.7-sonnet': [91.8, 85.0, 21.0],
    'Qwen3 (32b)': [90.2, 86.9, 19.7],
    'Phi-4 (14b)': [91.8, 81.0, 18.0],
    'Gemma-3 (4b)': [89.2, 76.6, 12.7]
}

# Dark theme setup
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(14, 8), facecolor='#1a1a1a')
ax.set_facecolor('#1a1a1a')

# Add rounded border around chart area (matching subplot layout)
border = FancyBboxPatch((0.08, 0.13), 0.88, 0.67, boxstyle="round,pad=0.02,rounding_size=0.02",
                        ec="#3a3a3a", fc='none', linewidth=1.5, transform=fig.transFigure, zorder=5)
fig.patches.append(border)

x = np.arange(len(benchmarks))
width = 0.12
spacing = 0.02

# Function to create gradient bar
def draw_gradient_bar(ax, x, y, width, height, color_bottom, color_top):
    """Draw a bar with vertical gradient"""
    n_segments = 50
    segment_height = height / n_segments
    for i in range(n_segments):
        # Interpolate color
        ratio = i / n_segments
        r = color_bottom[0] + (color_top[0] - color_bottom[0]) * ratio
        g = color_bottom[1] + (color_top[1] - color_bottom[1]) * ratio
        b = color_bottom[2] + (color_top[2] - color_bottom[2]) * ratio
        color = (r, g, b)
        rect = Rectangle((x, y + i * segment_height), width, segment_height, 
                         facecolor=color, edgecolor='none', zorder=3)
        ax.add_patch(rect)

# Colors for gradient (bottom to top): darker cyan to lighter cyan
color_bottom = (0.0, 0.7, 0.8)  # Darker cyan
color_top = (0.6, 0.95, 1.0)     # Lighter cyan

# Different grey shades for each competitor (edge and hatch color)
competitor_colors = {
    'Claude-3.7-sonnet': '#AAAAAA',  # Lightest grey
    'Qwen3 (32b)': '#888888',          # Medium-light grey
    'Phi-4 (14b)': '#666666',          # Medium grey
    'Gemma-3 (4b)': '#505050'          # Darker grey
}

# Plotting the bars
for i, model in enumerate(models):
    pos = x + (i - (len(models)-1)/2) * (width + spacing)
    benchmark_scores = scores[model]
    
    for j, score in enumerate(benchmark_scores):
        bar_x = pos[j] - width/2
        
        if model == 'Corpus-r1 (4b)':
            # Corpus-r1: Gradient Cyan bar
            draw_gradient_bar(ax, bar_x, 0, width, score, color_bottom, color_top)
            ax.text(pos[j], score + 1.5, f'{score}', ha='center', va='bottom', 
                    color='#00E5FF', fontproperties=gilroy_bold, fontsize=12)
        else:
            # Competitors: Hatched style with different grey shades
            color = competitor_colors[model]
            rect = Rectangle((bar_x, 0), width, score, 
                            facecolor='none', edgecolor=color, 
                            hatch='////', linewidth=1, zorder=2)
            ax.add_patch(rect)
            ax.text(pos[j], score + 1.5, f'{score}', ha='center', va='bottom', 
                    color=color, fontproperties=gilroy_medium, fontsize=11)

# X-axis customization
ax.set_xticks(x)
ax.set_xticklabels(benchmarks, fontsize=20, color='#CCCCCC', fontproperties=gilroy_medium)
ax.tick_params(axis='x', which='major', pad=8, length=0)
ax.set_xlim(-0.6, len(benchmarks) - 0.4)

# Y-axis customization - show labels
ax.set_ylim(0, 110)
ax.set_yticks([0, 20, 40, 60, 80, 100])
ax.set_yticklabels(['0', '20', '40', '60', '80', '100'], fontsize=13, color='#888888', fontproperties=gilroy_regular)
ax.tick_params(axis='y', length=0, pad=10)

# Remove spines
for spine in ax.spines.values():
    spine.set_visible(False)

# Title and Subtitle
fig.text(0.5, 0.92, 'Model performance comparison', fontsize=32, fontproperties=gilroy_bold, ha='center', color='white')
fig.text(0.5, 0.86, '(Corpus-r1 vs Others)', fontsize=16, fontproperties=gilroy_regular, ha='center', color='#888888')

# Legend setup - inside chart at top with matching grey shades (including throughput)
legend_elements = [
    mpatches.Patch(facecolor='#00CED1', edgecolor='none', label='Corpus-r1 (4b)\n~1100 tok/s'),
    mpatches.Patch(facecolor='none', edgecolor='#AAAAAA', hatch='////', label='Claude-3.7-sonnet\n~44 tok/s'),
    mpatches.Patch(facecolor='none', edgecolor='#888888', hatch='////', label='Qwen3 (32b)\n~58 tok/s'),
    mpatches.Patch(facecolor='none', edgecolor='#666666', hatch='////', label='Phi-4 (14b)\n~75 tok/s'),
    mpatches.Patch(facecolor='none', edgecolor='#505050', hatch='////', label='Gemma-3 (4b)\n~120 tok/s'),
]

legend = ax.legend(handles=legend_elements, loc='upper center', bbox_to_anchor=(0.5, 1.05), 
                   ncol=5, frameon=False, fontsize=12, labelcolor='#CCCCCC',
                   handlelength=1.5, handleheight=1.5, columnspacing=1.5, prop=gilroy_medium)

# Horizontal grid lines
ax.yaxis.grid(True, linestyle='-', color='#333333', alpha=0.6, zorder=0)
ax.set_axisbelow(True)

# Clip content to axes
ax.set_clip_on(True)

# Layout adjustment and saving
plt.subplots_adjust(left=0.1, right=0.94, top=0.78, bottom=0.15)
plt.savefig('model_comparison.png', dpi=300, facecolor='#1a1a1a')
plt.show()
