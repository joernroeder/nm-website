<section>
<ul>
	<% loop Projects %>
	<% if IsPublished %>
	<li>
		<article itemscope itemtype="http://schema.org/Article">
		<meta itemprop="articleBody" content="$MarkdownedTeaser.XML">
			<header>
				<h3><a itemprop="url" href="/<% if not $Top.LinkTo %>portfolio<% else %>about/{$Top.LinkTo}<% end_if %>/{$UglyHash}/"><span itemprop="name">$Title</span></a></h3>
				<% if PreviewImage %>
					<% with PreviewImage.Images.First %>
						<div>
							<img src="{$Link}" />
						</div>
					<% end_with %>
				<% end_if %>

				<% include ProjectHeaderMeta %>
			</header>
			<section>
				<p>$MarkdownedTeaser</p>
				<p><a itemprop="url" href="/<% if not $Top.LinkTo %>portfolio<% else %>about/{$Top.LinkTo}<% end_if %>/{$UglyHash}/">Read more</a></p>
			</section>
		</article>
	</li>
	<% end_if %>
	<% end_loop %>
</ul>
</section>