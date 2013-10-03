<section>
<ul>
	<% loop Projects %>
	<% if IsPublished %>
	<li>
		<article>
			<header>
				<h3><a href="/<% if not $Top.LinkTo %>portfolio<% else %>about/{$Top.LinkTo}<% end_if %>/{$UglyHash}/">$Title</a></h3>
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
				<p><a href="/{$Top.LinkTo}/{$UglyHash}/">Read more</a></p>
			</section>
		</article>
	</li>
	<% end_if %>
	<% end_loop %>
</ul>
</section>